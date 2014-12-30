
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('min', function() {
	return gulp.src('jquery.mods.js')
		.pipe($.uglify())
		.pipe($.rename({ suffix: '.min' }))
		.pipe(gulp.dest('./'));
});
