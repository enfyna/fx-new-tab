const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const purify = require('gulp-purifycss');
const cleanCSS = require('gulp-clean-css');
const replace = require('gulp-replace');
const jsonMin = require('gulp-json-minify');
const svgMin = require('gulp-svgmin')

function minifyHTML(page) {
    console.log(page)
    return gulp.src(page)
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

async function minifyJS(js) {
    console.log(js)
    return gulp.src(js)
        .pipe(replace('module.exports = {};', ''))
        .pipe(terser({
            keep_fnames: false,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
        }))
        .pipe(gulp.dest('build/js'))
}

function minifyCSS(css) {
    console.log(css)
    return gulp.src(css)
        .pipe(cleanCSS({ level: { 1: { all: true }, 2: { all: true } } }))
        .pipe(gulp.dest('build/css'));
}

function minifyBootstrapCSS() {
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/html/settings.html', 'src/html/index.html'], {
            whitelist: [
                'bg-black',
                'rounded-circle',
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
        .pipe(gulp.dest('build/css'));
}

function minifySVGIcons(icon) {
    console.log(icon)
    return gulp.src(icon)
        .pipe(svgMin())
        .pipe(gulp.dest('./build/assets/icons'));
}

function minifyJSON(json) {
    console.log(json)
    return gulp.src(json)
        .pipe(jsonMin())
        .pipe(gulp.dest('./build'));
}

const minifyHTML_Task = gulp.series(
    () => minifyHTML('src/html/index.html'),
    () => minifyHTML('src/html/settings.html'),
);

const minifyCSS_Task = gulp.series(
    minifyBootstrapCSS,
    () => minifyCSS('src/css/index.css'),
    () => minifyCSS('src/css/colors.css'),
);
const minifyJS_Task = gulp.series(
    () => minifyJS('build/js/script.js'),
    () => minifyJS('build/js/settings.js'),
    () => minifyJS('build/js/background.js'),
);
const minifyMisc_Task = gulp.series(
    () => minifyJSON('./manifest.json'),
    () => minifySVGIcons('./src/assets/icons/*'),
);
const minifyFull_Task = gulp.series(
    minifyHTML_Task,
    minifyCSS_Task,
    minifyJS_Task,
    minifyMisc_Task,
);

exports.minifyHTML = minifyHTML_Task;
exports.minifyCSS = minifyCSS_Task;
exports.minifyJS = minifyJS_Task;
exports.minifyMisc = minifyMisc_Task;
exports.minifyFull = minifyFull_Task;
