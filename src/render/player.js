import assign from 'object-assign';
import {Promise} from 'es6-promise';

import {noop} from '../utils';

const STORAGE_KEY = 'tvdml-media-resume-time';
const MARK_AS_WATCHED_PERCENT = 90;

const defaults = {
	items: null,
	uidResolver: null,
	markAsWatched: noop(),
	markAsWatchedPercent: MARK_AS_WATCHED_PERCENT,
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

export default function createPlayer(options = {}) {
	return Promise
		.resolve(assign({}, defaults, options))
		.then(options => {
			let player = new Player();
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
		.then(({player, options}) => {
			let {items, uidResolver} = options;
			return getMediaItems(items, uidResolver).then(mediaItems => ({player, options, mediaItems}));
		})
		.then(({player, mediaItems}) => {
			if (!mediaItems.length) {
				return Promise.reject('Nothing to play');
			}
			mediaItems.forEach(mediaItem => player.playlist.push(mediaItem));
			return player;
		});
}

function getMediaItems(items, uidResolver = uidResolver) {
	if (typeof(items) === 'function') {
		items = items();
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
		options: {uidResolver},
		player: {
			currentMediaItem: {item},
			currentMediaItemDuration,
		},
	} = payload;

	let {time} = event;

	console.log('timeDidChange', item, payload, event, currentMediaItemDuration);

	updateResumeTime(uidResolver(item), time);
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
