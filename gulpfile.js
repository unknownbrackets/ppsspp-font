const gulp = require('gulp');
const webpack = require('webpack-stream');

function handleErrors() {
	console.log(arguments);
	this.emit('end');
}

gulp.task('scripts', () => {
	return gulp.src('.webpack.config.js')
		.pipe(webpack(require('./webpack.config.js'), require('webpack')))
		.on('error', handleErrors)
		.pipe(gulp.dest('dist/'));
});

gulp.task('watch', () => {
  gulp.watch('./app/**/*.js', ['scripts']);
});

gulp.task('default', ['scripts']);
