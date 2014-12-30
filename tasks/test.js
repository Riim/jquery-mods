
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('test', function() {
	return gulp.src([
		'tests/jquery-2.1.3.min.js',
		'jquery.mods.js',
		'tests/**.spec.js'
	])
		.pipe($.karma({
			configFile: 'karma.conf.js',
			action: 'run'
		}));
});
