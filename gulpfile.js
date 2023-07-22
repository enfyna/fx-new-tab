const gulp = require('gulp');
const { series } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const purify = require('gulp-purifycss');
const cleanCSS = require('gulp-clean-css');

function minifyHTML() {
    return gulp.src('src/index.html')
        .pipe(htmlmin({collapseWhitespace: true})) 
        .pipe(gulp.dest('.'));
}

function minifyJS() {
    return gulp.src('tsc/script.js')
        .pipe(terser())
        .pipe(gulp.dest('tsc'));
}

function minifyBootstrapCSS() {
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/index.html', 'src/script.ts'], {
            whitelist : ['collapsing','show']
        }))
        .pipe(cleanCSS())
        .pipe(gulp.dest('tsc'));
}

exports.minify = series(minifyHTML, minifyJS);
exports.minifyCSS = minifyBootstrapCSS;