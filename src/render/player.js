import assign from 'object-assign';
import {Promise} from 'es6-promise';

import {noop} from '../utils';

const STORAGE_KEY = 'tvdml-media-resume-time';

const MARK_AS_WATCHED_PERCENT_BREAKPOINT = 90;
const REMOVE_RESUME_TIME_PERCENT_BREAKPOINT = 97;

const defaults = {
	items: null,
	uidResolver: null,
	markAsStopped: noop(),
	markAsWatched: noop(),
	markAsWatchedPercent: MARK_AS_WATCHED_PERCENT_BREAKPOINT,
};

const metadata = [
	'url',
	'title',
	'subtitle',
	'description',
	'artworkImageURL',
	'contentRatingDomain',
	'contentRatingRanking',
];

export default function createPlayer(player, options) {
	if (player instanceof Player) {
		options || (options = {});
	} else {
		options = player || {};
		player = undefined;
	}

	return Promise
		.resolve(assign({}, defaults, options))
		.then(options => {
			if (!player) player = new Player();
			player.playlist = new Playlist();
			return {player, options};
		})
		.then(payload => {
			let {player} = payload;
			let originalAddEventListener = player.addEventListener;
			let originalRemoveEventListener = player.removeEventListener;
			let shouldHandleStateChangeCtx = {userHandler: null};

			player.addEventListener('shouldHandleStateChange', shouldHandleStateChange.bind(this, shouldHandleStateChangeCtx, payload));
			player.addEventListener('timeDidChange', timeDidChange.bind(this, payload), {interval: 1});
			player.addEventListener('stateDidChange', stateDidChange.bind(this, payload));

			// Overriding `addEventListener` and `removeEventListener` methods to resolve issue 
			// with single `shouldHandleStateChange` event listener. With this proxies we can have 
			// our internal handler and user handler simultaneous.
			player.addEventListener = function TVDMLWrapper(eventName, listener) {
				if (eventName === 'shouldHandleStateChange') {
					shouldHandleStateChangeCtx.userHandler = listener;
				} else {
					return originalAddEventListener.apply(this, arguments);
				}
			}

			player.removeEventListener = function TVDMLWrapper(eventName, listener) {
				if (eventName === 'shouldHandleStateChange') {
					if (shouldHandleStateChangeCtx.userHandler === listener) {
						shouldHandleStateChangeCtx.userHandler = null;
					}
				} else {
					return originalRemoveEventListener.apply(this, arguments);
				}
			}

			return payload;
		})
		.then(updatePlaylist)
		.then(({player}) => player);
}

function updatePlaylist(payload) {
	let {
		player, 
		options: {
			items, 
			uidResolver,
		},
	} = payload;

	return getMediaItems(player, items, uidResolver)
		.then(mediaItems => {
			if (!mediaItems.length) {
				return Promise.reject('Nothing to play');
			}
			mediaItems.forEach(mediaItem => player.playlist.push(mediaItem));
			return assign({mediaItems}, payload);
		});
}

function getMediaItems(player, items, uidResolver = uidResolver) {
	let {currentMediaItem} = player;

	if (typeof(items) === 'function') {
		let currentItem = currentMediaItem ? currentMediaItem.item : null;
		let request = currentMediaItem ? 'next' : 'initial';

		items = items(currentItem, request);
	}

	return Promise
		.resolve(items)
		.then(list => [].concat(list || []).filter(Boolean))
		.then(list => list.map(item => {
			let mediaItem = new MediaItem(item.type || 'video', item.url);
			let resumeTime = item.resumeTime || getResumeTime(uidResolver(item));

			mediaItem.item = item;
			metadata
				.filter(name => name in item)
				.forEach(name => mediaItem[name] = item[name]);

			if (resumeTime) {
				mediaItem.resumeTime = parseFloat(resumeTime);
			}

			return mediaItem;
		}));
}

function timeDidChange(payload, event) {
	let {
		options: {
			items,
			uidResolver,
			markAsWatched,
			markAsWatchedPercent,
		},
		player: {
			currentMediaItem,
			currentMediaItemDuration,
		},
	} = payload;

	let {time} = event;
	let {item, markedAsWatched} = currentMediaItem;

	let uid = uidResolver(item);
	let watchedPercent = ~~(time * 100 / currentMediaItemDuration);

	if (watchedPercent >= REMOVE_RESUME_TIME_PERCENT_BREAKPOINT) {
		getResumeTime(uid) && removeResumeTime(uid);
	} else {
		updateResumeTime(uid, time);
	}

	if (watchedPercent >= markAsWatchedPercent && !markedAsWatched) {
		currentMediaItem.markedAsWatched = true;
		markAsWatched(item);
	}

	if (typeof(items) === 'function' && !currentMediaItem.nextItemsRequested) {
		currentMediaItem.nextItemsRequested = true;
		updatePlaylist(payload);
	}
}

function stateDidChange(payload, event) {
	let {
		player,
		options: {
			uidResolver,
			markAsStopped,
		},
	} = payload;

	let {currentMediaItem} = player;

	if (currentMediaItem && event.state === 'end') {
		let {item} = currentMediaItem;
		let uid = uidResolver(item);
		let elapsedTime = getResumeTime(uid);
		markAsStopped(item, elapsedTime);
	}

	// Feture detecting `currentMediaItemDuration` if there is no such property in player instance 
	// then app is running under tvOS 9 and we need to use workaround to get current video duration.
	if (!('currentMediaItemDuration' in player) && event.state === 'playing') {
		player.pause();
	}
}

function shouldHandleStateChange(ctx, payload, event) {
	let {player} = payload;
	let {userHandler} = ctx;

	// If there is no `currentMediaItemDuration` property in player then this handler was called 
	// only to retrieve duration. 
	// Filling propperty and skipping state change.
	if (!('currentMediaItemDuration' in player)) {
		player.currentMediaItemDuration = event.duration;
		return false;
	}

	if (typeof(userHandler) === 'function') {
		return userHandler(event)
	}

	return true;
}

function uidResolver({url}) {
	return url;
}

function getResumeTime(id) {
	return localStorage.getItem(`${STORAGE_KEY}-${id}`);
}

function updateResumeTime(id, value = 0) {
	localStorage.setItem(`${STORAGE_KEY}-${id}`, value);
}

function removeResumeTime(id) {
	localStorage.removeItem(`${STORAGE_KEY}-${id}`);
}
