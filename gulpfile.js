var gulp = require('gulp');
var gutil = require('gulp-util');

var rm = require('gulp-rm');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

var xtend = require('xtend');
var babelify = require('babelify');
var browserify = require('browserify');
var prettyBytes = require('pretty-bytes');
var incremental = require('browserify-incremental');

var through = require('through2');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var EXPOSE = 'TVDML';
var LIVE = process.argv.indexOf('--production') !== -1;

var DEST = './out';
var SOURCE = './src';
var CACHE = './build.json';

function pass() {
	return through.obj();
}

gulp.task('build', function() {
	var build = browserify(xtend(incremental.args, {
		debug: true,
		entries: SOURCE + '/index.js',
		standalone: EXPOSE,
	}));

	if (!LIVE) {
		incremental(build, {cacheFile: CACHE});
	}

	return build
		.on('log', function(info) {
			var parts = info.split(/\s*bytes\s*/);
			parts[0] = prettyBytes(+parts[0]);
			gutil.log(gutil.colors.green('Build info:'), parts.join(' '));
		})
		.transform(babelify, {
			global: true,
			presets: ['es2015', 'react'],
		})
		.bundle()
		.on('error', function(error) {
			gutil.log(gutil.colors.red('Browserify compile error:'), error.message);
			this.emit('end');
		})
		.pipe(source('tvdml.js'))
		.pipe(buffer())
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
		gulp.start('build')
	});
});

gulp.task('default', ['build']);
