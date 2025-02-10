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
    console.log('bootstrap/bootstrap.css')
    return gulp.src('bootstrap/bootstrap.css')
        .pipe(purify(['src/html/settings.html', 'src/html/index.html'], {
            whitelist: [
                'bg-black',
                'rounded-circle',
                'border-0',
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

function minifyLang(json) {
    console.log(json)
    return gulp.src(json)
        .pipe(jsonMin())
        .pipe(gulp.dest('./build/_locales'));
}

const task_html = gulp.series(
    () => minifyHTML('src/html/*'),
);

const task_js = gulp.series(
    () => minifyJS('build/js/*'),
);

const task_css = gulp.series(
    () => minifyBootstrapCSS(),
    () => minifyCSS('src/css/index.css'),
    () => minifyCSS('src/css/colors.css'),
);

const task_misc = gulp.series(
    () => minifyJSON('./manifest.json'),
    () => minifyLang('./src/_locales/*/*'),
    () => minifySVGIcons('./src/assets/icons/*'),
);

const task_full = gulp.series(
    task_html,
    task_css,
    task_js,
    task_misc,
);

exports.js = task_js;
exports.css = task_css;
exports.html = task_html;
exports.misc = task_misc;
exports.full = task_full;
exports.default = exports.full;
