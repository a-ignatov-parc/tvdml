'use strict';

const stream = require('stream');

const gulp = require('gulp');
const utils = require('gulp-util');

const rm = require('gulp-rm');
const watch = require('gulp-watch');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

const babelify = require('babelify');
const browserify = require('browserify');
const prettyBytes = require('pretty-bytes');
const incremental = require('browserify-incremental');

const File = utils.File;

const EXPOSE = 'TVDML';
const LIVE = !!~process.argv.indexOf('--production');

const DEST = './dist';
const SOURCE = './src';
const CACHE = './build.json';

function pass() {
	return new stream.Transform({
		objectMode: true,
		transform(file, enc, next) {
			next(null, file);
		},
	});
}

function buffer(filename) {
	let chunks = '';

	return new stream.Transform({
		objectMode: true,

		transform(chunk, enc, next) {
			chunks += chunk;
			next();
		},

		flush(done) {
			this.push(new File({
				path: filename,
				contents: new Buffer(chunks),
			}));
			done();
		},
	});
}

gulp.task('build', function() {
	const build = browserify(Object.assign({}, incremental.args, {
		debug: true,
		entries: SOURCE + '/index.js',
		standalone: EXPOSE,
	}));

	if (!LIVE) {
		incremental(build, {cacheFile: CACHE});
	}

	return build
		.on('log', function(info) {
			const parts = info.split(/\s*bytes\s*/);
			parts[0] = prettyBytes(+parts[0]);
			utils.log(utils.colors.green('Build info:'), parts.join(' '));
		})
		.transform(babelify, {
			global: true,
			presets: ['es2015'],
		})
		.bundle()
		.on('error', function(error) {
			utils.log(utils.colors.red('Browserify compile error:'), error.message);
			this.emit('end');
		})
		.pipe(buffer('tvdml.js'))
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(LIVE ? uglify() : pass())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(DEST));
});

gulp.task('clear-cache', function() {
	return gulp
		.src(CACHE, {read: false})
		.pipe(rm());
});

gulp.task('watch', ['clear-cache'], function() {
	gulp.start('build');

	watch([SOURCE + '/**/*.js'], function() {
		gulp.start('build');
	});
});

gulp.task('default', ['build']);
