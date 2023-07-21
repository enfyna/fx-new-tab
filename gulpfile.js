const gulp = require('gulp');
const { series } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const sourcemaps = require('gulp-sourcemaps');

function minifyHTML() {
    return gulp.src('src/index.html')
        .pipe(htmlmin({collapseWhitespace: true})) 
        .pipe(gulp.dest('.'));
}

function minifyJS() {
    return gulp.src('tsc/script.js')
        .pipe(sourcemaps.init()) 
        .pipe(terser())
        .pipe(sourcemaps.write('.')) 
        .pipe(gulp.dest('tsc'));
}

exports.minify = series(minifyHTML, minifyJS);