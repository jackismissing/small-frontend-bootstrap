var config          = require('./config');
var fs              = require('fs');
var del             = require('del');
var gulp            = require('gulp');
var merge           = require('merge-stream');
var jspm            = require('jspm');
var watch           = require('gulp-watch');
var sourcemaps      = require('gulp-sourcemaps');
var stylus          = require('gulp-stylus');
var autoprefixer    = require('gulp-autoprefixer');
var notify          = require('gulp-notify');
var debug           = require('gulp-debug');
var stripDebug      = require('gulp-strip-debug');
var browserSync     = require('browser-sync').create();

/**
 * ------------------------------------------------------------
 * Default task
 * ------------------------------------------------------------
 */
gulp.task('default', ['init']);


/**
 * ------------------------------------------------------------
 * Init tasks
 * ------------------------------------------------------------
 */
gulp.task('init', ['copy:js', 'copy:css']);

/**
 * Copy JS
 */
gulp.task('copy:js', function() {
    var jsFiles = config.srcAssetsPath + '/js/**/*.js';
    return gulp.src(jsFiles)
        .pipe(gulp.dest(config.publicPath + '/js/'));
});

/**
 * Copy CSS
 */
gulp.task('copy:css', function() {
    var stylFiles = config.srcAssetsPath + '/stylus/*.styl';
    return gulp.src(stylFiles)
        .pipe(stylus({ 'include css': true }))
        .on('error', handleErrors)
        .pipe(autoprefixer(config.autoprefixer || {}))
        .pipe(gulp.dest(config.publicPath + '/css/'));
});

/**
 * ------------------------------------------------------------
 * Watch tasks
 * ------------------------------------------------------------
 */
gulp.task('watch', ['browserSync', 'watch:js', 'watch:css', 'watch:views']);

/* Instantiates BrowserSync */
gulp.task('browserSync', function() {
    browserSync.init(['**'], {
        server: {
            baseDir: "./public"
        },
        watchOptions: {
            ignored: ['**/*']
        }
    });
});

/**
 * Watch JS
 * Copy JS files from resources to public and notifies browserSync
 */
gulp.task('watch:js', function() {
    var jsFiles = config.srcAssetsPath + '/js/**/*.js';

    // Copy JS before hand so we can use that task at app init
    watch(jsFiles, function(file) {
        // Gets trailing path component + filename; ex: /bundles/bundleA.js
        var trailingPath = file.path.slice(file.base.length);

        // Gets additional path component without filename
        var base = trailingPath.lastIndexOf('/') > -1 ? trailingPath.slice(0, trailingPath.lastIndexOf('/') + 1) : '';
        return gulp.src(file.path)
            .pipe(gulp.dest(config.publicPath + '/js/' + base))
            .pipe(browserSync.stream());
    });
});

/**
 * Watch CSS
 * Copy CSS files from resources to public and notifies browserSync
 */
gulp.task('watch:css', function() {
    var stylFiles = config.srcAssetsPath + '/stylus/**/*.styl';
    watch(stylFiles, function(file) {
        return gulp.src(config.srcAssetsPath + '/stylus/app.styl')
            .pipe(sourcemaps.init())
            .pipe(stylus({ 'include css': true }))
            .on('error', handleErrors)
            .pipe(autoprefixer(config.autoprefixer || {}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(config.publicPath + '/css/'))
            .pipe(browserSync.stream({match: '**/*.css'}));
    });
});

/**
 * Watch views
 * Doesn't copy anything, just notifies browserSync
 */
gulp.task('watch:views', function() {
    var views = config.publicPath + '/index.html';
    watch(views, function(file) {
        return gulp.src(file.path)
            .pipe(browserSync.stream());
    });
});

/**
 * ------------------------------------------------------------
 * Build tasks
 * ------------------------------------------------------------
 */
gulp.task('build');

/**
 * Clean JS
 * Clean JS public files
 */
gulp.task('clean:js', function() {
    console.log('Cleaning public JavaScript folder');
    return del.sync([config.publicPath + '/js/**', '!' + config.publicPath + '/js']);
});

gulp.task('buildAdminJs', function() {
    console.log('Bundling admin JS...');

    return jspm.bundleSFX('js/admin/admin.js', config.buildPath + '/js/admin.js', {
            minify: true,
            sourceMaps: false
        }).then(function() {
            console.log('JS app bundle complete !');
            console.log('Stripping console logs...');
            var appBundle = gulp.src(config.buildPath + '/js/admin.js')
                .pipe(stripDebug())
                .pipe(gulp.dest(config.buildPath + '/js'));
        });
});

/**
 * Build JS
 * Bundles + minify JS modules with JSPM and strips console logs
 */
gulp.task('build:js', function() {
    // Bundles JS via JSPM
    console.log('Bundling JS...');

    // Delete any JS file in the build folder
    return del(config.buildPath + '/js/*.js').then(function() {

        // Desktop bundle
        return jspm.bundleSFX('js/app/app.js', config.buildPath + '/js/app.js', {
            minify: true,
            sourceMaps: false
        }).then(function() {
            console.log('JS app bundle complete !');
            console.log('Stripping console logs...');
            var appBundle = gulp.src(config.buildPath + '/js/app.js')
                .pipe(stripDebug())
                .pipe(gulp.dest(config.buildPath + '/js'));

            // Mobile bundle
            return jspm.bundleSFX('js/mobile/mobile.js', config.buildPath + '/js/mobile.js', {
                minify: true,
                sourceMaps: false
            }).then(function() {
                console.log('JS mobile bundle complete !');
                console.log('Stripping console logs...');
                var mobileBundle = gulp.src(config.buildPath + '/js/mobile.js')
                    .pipe(stripDebug())
                    .pipe(gulp.dest(config.buildPath + '/js'));

                return merge(appBundle, mobileBundle);
            });

        });
    });
});

/**
 * Build JS Dependencies
 * Bundles + minify JS dependencies with JSPM
 */
gulp.task('build:jsDependencies', function() {
    // Bundles JS via JSPM
    console.log('Bundling JS application deps...');

    return jspm.bundle('app/**/* - [app/**/*]', config.publicPath + '/js/app.vendors.js', {
        minify: true,
        sourcemaps: false,
        inject: true
    }).then(function() {
        console.log('JS application deps bundle complete !');

        console.log('Bundling JS mobile deps...');
        return jspm.bundle('mobile/**/* - [mobile/**/*]', config.publicPath + '/js/mobile.vendors.js', {
            minify: true,
            sourceMaps: false,
            inject: true
        });
    }).then(function() {
        console.log('JS mobile deps bundle complete !');
    });
});

/**
 * Build CSS
 * Minifies CSS
 */
gulp.task('build:css', function() {
    console.log('Minifying CSS...');

    // Delete any CSS file in the build folder
    return del(config.buildPath + '/css/*.css').then(function() {
        return gulp.src(config.publicPath + '/css/app.css')
            .pipe(minifyCss())
            .pipe(gulp.dest(config.buildPath + '/css'));
    });
})

/**
 * ------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------
 */

/**
 * Displays errors popup
 */
function handleErrors() {
    var args = Array.prototype.slice.call(arguments);
    notify.onError({
        title: 'Compile Error',
        message: '<%= error.message %>'
    }).apply(this, args);

    this.emit('end');
};

/**
 * Recursively creates directories
 * TODO: Be able to mkdir more than two folders
 */
function mkdirRecursive(dir, originDir, mode, cb) {
    fs.mkdir(dir, mode, function(error) {
        if (error && error.code === 'ENOENT') {
            console.log('Parent folder doesnt exist, it will be created');
            mkdirRecursive(dir.slice(0, dir.lastIndexOf('/')), dir, mode, cb);

        } else {
            console.log('Folder was created');
            if (originDir !== null) {
                // Mkdir original dir
                mkdirRecursive(originDir, null, mode, cb);
            } else {
                cb();
            }
        }
    });
};
