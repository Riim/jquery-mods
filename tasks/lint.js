
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('lint', function() {
	return gulp.src('jquery.mods.js')
		.pipe($.jscs())
		.pipe($.eslint())
		.pipe($.eslint.format());
});
