const gulp = require('gulp');
const { series } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const purify = require('gulp-purifycss');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const replace = require('gulp-replace');
const jsonMin = require('gulp-json-minify');
const svgMin = require('gulp-svgmin')

function minifyIndex() {
    return gulp.src('src/html/index.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            removeTagWhitespace: true,
            removeAttributeQuotes: true,
            collapseBooleanAttributes: true,
            minifyCSS: true,
        }))
        .pipe(gulp.dest('./build'));
}

function minifySettings() {
    return gulp.src('src/html/settings.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            removeTagWhitespace: true,
            removeAttributeQuotes: true,
            collapseBooleanAttributes: true,
            minifyCSS: true,
        }))
        .pipe(gulp.dest('./build'));
}

async function minifyIndexJS() {
    const del = await import('del')
    return gulp.src('build/js/script.js')
        .pipe(replace('module.exports = {};', ''))
        .pipe(terser({
            keep_fnames: false,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
        }))
        .pipe(gulp.dest('build/js'))
        .on('end', () =>
            del.deleteSync('build/script.js')
        );
}

async function minifySettingsJS() {
    const del = await import('del')
    return gulp.src('build/js/settings.js')
        .pipe(replace('module.exports = {};', ''))
        .pipe(terser({
            keep_fnames: false,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
        }))
        .pipe(gulp.dest('build/js'))
        .on('end', () =>
            del.deleteSync('build/settings.js')
        );
}

async function minifyBackgroundJS() {
    const del = await import('del')
    return gulp.src('build/js/background.js')
        .pipe(replace('module.exports = {};', ''))
        .pipe(terser({
            keep_fnames: false,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
        }))
        .pipe(gulp.dest('build/js'))
        .on('end', () =>
            del.deleteSync('build/background.js')
        );
}

function minifyIndexBootstrapCSS() {
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/html/index.html'], {
            whitelist: [
                'rounded-circle',
                'bg-black',
            ]
        }))
        .pipe(cleanCSS({ level: { 1: { all: true }, 2: { all: true } } }))
        .pipe(rename('bootstrap.css'))
        .pipe(gulp.dest('build/css'));
}

function minifyIndexCSS() {
    return gulp.src('src/css/index.css')
        .pipe(cleanCSS({ level: { 1: { all: true }, 2: { all: true } } }))
        .pipe(rename('index.css'))
        .pipe(gulp.dest('build/css'));
}

function minifyColorsCSS() {
    return gulp.src('src/css/colors.css')
        .pipe(cleanCSS({ level: { 1: { all: true }, 2: { all: true } } }))
        .pipe(rename('colors.css'))
        .pipe(gulp.dest('build/css'));
}

function minifySettingsCSS() {
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/html/settings.html'], {
            whitelist: [
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
        .pipe(cleanCSS({ level: { 1: { all: true }, 2: { all: true } } }))
        .pipe(rename('settings.css'))
        .pipe(gulp.dest('build/css'));
}

function Assets() {
    return gulp.src('./src/assets/icons/*')
        .pipe(svgMin())
        .pipe(gulp.dest('./build/assets/icons'));
}

function minifyManifest() {
    return gulp.src('./manifest.json')
        .pipe(jsonMin())
        .pipe(gulp.dest('./build'));
}

exports.minifyHTML = series(
    minifyIndex,
    minifySettings,
);
exports.minifyCSS = series(
    minifyIndexBootstrapCSS,
    minifyIndexCSS,
    minifyColorsCSS,
    minifySettingsCSS,
);
exports.minifyJS = series(
    minifyIndexJS,
    minifySettingsJS,
    minifyBackgroundJS,
);
exports.minifyFull = series(
    minifyManifest,
    Assets,
    minifyIndex,
    minifySettings,
    minifyIndexBootstrapCSS,
    minifyIndexCSS,
    minifyColorsCSS,
    minifySettingsCSS,
    minifyIndexJS,
    minifySettingsJS,
    minifyBackgroundJS,
);