import assign from 'object-assign';
import {Promise} from 'es6-promise';

import {noop} from '../utils';

const STORAGE_KEY = 'tvdml-media-resume-time';

const MARK_AS_WATCHED_PERCENT_BREAKPOINT = 90;
const REMOVE_RESUME_TIME_PERCENT_BREAKPOINT = 97;

const defaults = {
	items: null,
	uidResolver: null,
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

			player.addEventListener('shouldHandleStateChange', shouldHandleStateChange.bind(this, payload));
			player.addEventListener('timeDidChange', timeDidChange.bind(this, payload), {interval: 1});
			player.addEventListener('mediaItemDidChange', mediaItemDidChange.bind(this, payload));
			player.addEventListener('stateDidChange', stateDidChange.bind(this, payload));

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
			let resumeTime = getResumeTime(uidResolver(item));

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

	console.log('timeDidChange', item, payload, event, currentMediaItemDuration, watchedPercent);

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
	let {player} = payload;

	// Feture detecting `currentMediaItemDuration` if there is no such property in player instance 
	// then app is running under tvOS 9 and we need to use workaround to get current video duration.
	if (!('currentMediaItemDuration' in player) && event.state === 'playing') {
		player.pause();
	}

	console.log('stateDidChange', payload, event);
}

function mediaItemDidChange(payload, event) {
	console.log('mediaItemDidChange', payload, event);
}

function shouldHandleStateChange(payload, event) {
	let {player} = payload;

	console.log('shouldHandleStateChange', payload, event);

	// If there is no `currentMediaItemDuration` property in player then this handler was called 
	// only to retrieve duration. 
	// Filling propperty and skipping state change.
	if (!('currentMediaItemDuration' in player)) {
		player.currentMediaItemDuration = event.duration;
		return false;
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
