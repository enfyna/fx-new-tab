const gulp = require('gulp');
const { series } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const purify = require('gulp-purifycss');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');

function minifyIndex() {
    return gulp.src('src/index/index.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('.'));
}

function minifySettings() {
    return gulp.src('src/settings/settings.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('.'));
}

function minifyIndexJS() {
    return gulp.src('tsc/script.js')
        .pipe(terser())
        .pipe(gulp.dest('build'));
}

function minifySettingsJS() {
    return gulp.src('tsc/settings.js')
        .pipe(terser())
        .pipe(gulp.dest('build'));
}

function minifyIndexCSS() {
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/index/index.html']))
        .pipe(cleanCSS())
        .pipe(rename('index.css'))
        .pipe(gulp.dest('build'));
}

function minifySettingsCSS(){
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/settings/settings.html'], {
            whitelist : [
                // input groups
                'dropdown-toggle',
                'form-select',
                'has-validation',
                'form-floating',
                'form-control',
                'dropdown-menu',
                'input-group',
                'valid-tooltip',
                'invalid-tooltip',
                'invalid-feedback',
            ]
        }))
        .pipe(cleanCSS())
        .pipe(rename('settings.css'))
        .pipe(gulp.dest('build'));
}

exports.minify = series(
    minifyIndex,
    minifyIndexJS,
    minifySettings,
    minifySettingsJS,
);
exports.minifyCSS = series(
    minifyIndexCSS,
    minifySettingsCSS,
);