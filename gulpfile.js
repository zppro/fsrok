var args        = require('yargs').argv,
    gulp        = require('gulp'),
    $plugins    = require('gulp-load-plugins')(),
    gulpsync    = $plugins.sync(gulp),
    del         = require('del')
    _           = require('underscore');

// production mode (see build task)
var isProduction = false;

var target = args.target;
if(!target)
{
    target = 'default';
}

var paths = {
    src_client: './src/' + target + '/',
    build:'./build/',
    pub_server: './pub-server/',
    pub_client_develop: './pub-client-develop/' + target + '/',
    pub_client_production: './pub-client-production/' + target + '/',
    pub_client_app_develop: './pub-client-develop/' + target + '/app/',
    pub_client_app_production: './pub-client-production/' + target + '/app/'
};



var bower = {
    // scripts required to start the app
    source_base_js: _.map(require(paths.build + 'gulp-' + target + '-bower-base-js.json'), function (o) {
        return o.replace(/\{\{(.+?)\}\}/g, target)
    }),
    name_concat_js: 'base.js',
    dest_base_develop: paths.pub_client_app_develop + 'js/',
    dest_base_production: paths.pub_client_app_production + 'js/',
    // vendor scripts to make the app work. Usually via lazy loading
    source_app: _.map(require(paths.build + 'gulp-' + target + '-bower.json'), function (o) {
        return o.replace(/\{\{(.+?)\}\}/g, target)
    }),
    dest_develop: paths.pub_client_develop + 'vendor/',
    dest_production: paths.pub_client_production + 'vendor/'
};

// VENDOR CONFIG
var vendor = {
    // vendor css required to start the app
    source_base_css: _.map(require(paths.build + 'gulp-vendor-base-css.json'), function (o) {
        return o.replace(/\{\{(.+?)\}\}/g, target)
    }),
    dest_develop: paths.pub_client_develop + 'vendor/',
    dest_production: paths.pub_client_production + 'vendor/'
};

// server data config
var serverdata = {
    // server data required to start the app
    watch: paths.src_client + 'server/**/*',
    source: paths.src_client + 'server/**/*',
    dest_develop: paths.pub_client_develop + 'server/',
    dest_production: paths.pub_client_production + 'server/'
};

// SOURCES CONFIG
var source = {
    images: {
        watch: paths.src_client + 'img/**/*',
        app: paths.src_client + 'img/**/*'
    },
    i18n: {
        watch: paths.src_client + 'i18n/*',
        app: paths.src_client + 'i18n/*'
    },
    less: {
        watch: [paths.src_client + 'less/**/*', '!' + paths.src_client + 'less/themes/*'],
        app: paths.src_client + 'less/*.*',
        themes: paths.src_client + 'less/themes/*'
    },
    scripts: {
        watch: [paths.src_client + 'js/**/*', '!' + paths.src_client + 'js/custom/**/*'],
        app: [
            paths.src_client + 'js/app.module.js',
            // template modules
            paths.src_client + 'js/modules/**/*.module.js',
            paths.src_client + 'js/modules/**/*.js',
            // custom modules
            paths.src_client + 'js/custom/**/*.module.js',
            paths.src_client + 'js/custom/**/*.js'
        ],
        name_concat_js: 'app.js'
    },
    jade: {
        watch: paths.src_client + 'jade/**/*.jade',
        index: paths.src_client + 'jade/index.jade',
        pages: [paths.src_client + 'jade/pages/**/*.*'],
        pages_root: paths.src_client + 'jade/pages',
        views: [paths.src_client + 'jade/views/**/*.*'],
        views_root: paths.src_client + 'jade/views'
    }
};

// BUILD TARGET CONFIG
var build = {
    develop: {
        images: paths.pub_client_app_develop + 'img/',
        i18n: paths.pub_client_app_develop + 'i18n/',
        styles: paths.pub_client_app_develop + 'css/',
        scripts: paths.pub_client_app_develop + 'js/',
        jade: {
            index: paths.pub_client_develop,
            pages: paths.pub_client_app_develop + 'pages/',
            views: paths.pub_client_app_develop + 'views/'
        }
    },
    production: {
        images: paths.pub_client_app_production + 'img/',
        i18n: paths.pub_client_app_production + 'i18n/',
        styles: paths.pub_client_app_production + 'css/',
        scripts: paths.pub_client_app_production + 'js/',
        jade: {
            index: paths.pub_client_production,
            pages: paths.pub_client_app_develop + 'pages/',
            views: paths.pub_client_app_production + 'views/'
        }
    }
};

var delconfig = {
    develop: paths.pub_client_develop,
    production: paths.pub_client_production
};

var vendorUglifyOpts = {
    mangle: {
        except: ['$super'] // rickshaw requires this
    }
};

//---------------
// TASKS
//---------------

// BOWER
// Build the base script to start the application from vendor assets
gulp.task('bower:base', function() {
    log('Copying base bower..');
    return gulp.src(bower.source_base_js)
        .pipe($plugins.expectFile(bower.source_base_js))
        .pipe($plugins.if(isProduction, $plugins.uglify()))
        .pipe($plugins.concat(bower.name_concat_js))
        .pipe(gulp.dest(isProduction ? bower.dest_base_production : bower.dest_base_develop))
        ;
});


// copy file from bower folder into the app vendor folder
gulp.task('bower:app', function() {
    log('Copying bower app..');

    var jsFilter = $plugins.filter('**/*.js', {restore: true});
    var cssFilter = $plugins.filter('**/*.css', {restore: true});

    return gulp.src(bower.source_app, {base: paths.src_client + 'bower_components'})
        .pipe($plugins.expectFile(bower.source_app))
        .pipe(jsFilter)
        .pipe($plugins.if(isProduction, $plugins.uglify(vendorUglifyOpts)))
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe($plugins.if(isProduction, $plugins.minifyCss()))
        .pipe(cssFilter.restore)
        .pipe(gulp.dest(isProduction ? bower.dest_production : bower.dest_develop))
});

gulp.task('bower', gulpsync.sync(['bower:base','bower:app']) );

// Build the base css to start the application from vendor assets
gulp.task('vendor:base:css', function() {
    log('Copying base vendor css..');
    return gulp.src(vendor.source_base_css)
        .pipe($plugins.expectFile(vendor.source_base_css))
        .pipe($plugins.if(isProduction, $plugins.minifyCss()))
        .pipe(gulp.dest(isProduction ? vendor.dest_production : vendor.dest_develop))
        ;
});


gulp.task('vendor',['vendor:base:css']);

// Build the server data to start the application
gulp.task('server:data', function() {
    log('Copying serverdata ..');
    return gulp.src(serverdata.source)
        .pipe(gulp.dest(isProduction ? serverdata.dest_production : serverdata.dest_develop))
        .pipe($plugins.livereload())
        ;
});


gulp.task('server',['server:data']);

// Images:app
gulp.task('images:app',function() {
    log('Building images app..');
    return gulp.src(source.images.app)
        .pipe(gulp.dest(isProduction ? build.production.images : build.develop.images))
        .pipe($plugins.livereload())
        ;
});

gulp.task('images',[
    'images:app'
]);

// I18N:app
gulp.task('i18n:app',function() {
    log('Building i18n app..');
    return gulp.src(source.i18n.app)
        .pipe(gulp.dest(isProduction ? build.production.i18n : build.develop.i18n))
        .pipe($plugins.livereload())
        ;
});

gulp.task('i18n',[
    'i18n:app'
]);

// Styles:less app
gulp.task('styles:less:app',function() {
    log('Building less app..');
    return gulp.src(source.less.app)
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.init()))
        .pipe($plugins.less())
        .on('error', handleError)
        .pipe($plugins.if(isProduction, $plugins.minifyCss()))
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.write()))
        .pipe(gulp.dest(isProduction ? build.production.styles : build.develop.styles))
        .pipe($plugins.livereload())
        ;
});

// Styles:less app-rtl
gulp.task('styles:less:app-rtl', function() {
    log('Building less app-RTL styles..');
    return gulp.src(source.less.app)
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.init()))
        .pipe($plugins.less())
        .on('error', handleError)
        .pipe($plugins.cssFlipper())
        .pipe($plugins.if(isProduction, $plugins.minifyCss()))
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.write()))
        .pipe($plugins.rename(function(path) {
            path.basename += "-rtl";
            return path;
        }))
        .pipe(gulp.dest(isProduction ? build.production.styles : build.develop.styles))
        .pipe($plugins.livereload())
        ;
});

// Styles:less themes
gulp.task('styles:less:themes', function() {
    log('Building less app theme styles..');
    return gulp.src(source.less.themes)
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.init()))
        .pipe($plugins.less())
        .on('error', handleError)
        .pipe($plugins.if(isProduction, $plugins.minifyCss()))
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.write()))
        .pipe(gulp.dest(isProduction ? build.production.styles : build.develop.styles))
        //.pipe($plugins.livereload())
        ;
});


gulp.task('styles',[
    'styles:less:app',
    'styles:less:app-rtl',
    'styles:less:themes'
]);

// JS APP
gulp.task('scripts:app', function() {
    log('Building scripts app..');
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(source.scripts.app)
        .pipe($plugins.jsvalidate())
        .on('error', handleError)
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.init()))
        .pipe($plugins.concat(source.scripts.name_concat_js))
        .pipe($plugins.ngAnnotate())
        .on('error', handleError)
        .pipe($plugins.if(isProduction, $plugins.uglify({preserveComments: 'some'})))
        .on('error', handleError)
        .pipe($plugins.if(isProduction, $plugins.sourcemaps.write()))
        .pipe(gulp.dest(isProduction ? build.production.scripts : build.develop.scripts))
        .pipe($plugins.livereload())
        ;
});

gulp.task('scripts',[
    'scripts:app'
]);

// JADE
gulp.task('jade:index',function() {
    log('Building jade index..');
    return gulp.src(source.jade.index)
        .pipe($plugins.jade({pretty: true}))
        .on('error', handleError)
        .pipe(gulp.dest(isProduction ? build.production.jade.index : build.develop.jade.index))
        .pipe($plugins.livereload())
        ;
});

gulp.task('jade:pages', function() {
    log('Building jade pages.. ');

    return gulp.src(source.jade.pages, {base: source.jade.pages_root})
        .pipe($plugins.if(!isProduction, $plugins.changed(build.develop.jade.pages, {extension: '.html'})))
        .pipe($plugins.jade({pretty: true}))
        .on('error', handleError)
        .pipe(gulp.dest(isProduction ? build.production.jade.pages : build.develop.jade.pages))
        ;
});

gulp.task('jade:views', function() {
    log('Building jade views.. ');

    return gulp.src(source.jade.views, {base: source.jade.views_root})
        .pipe($plugins.if(!isProduction, $plugins.changed(build.develop.jade.views, {extension: '.html'})))
        .pipe($plugins.jade({pretty: true}))
        .on('error', handleError)
        .pipe(gulp.dest(isProduction ? build.production.jade.views : build.develop.jade.views))
        ;
});

gulp.task('jade',[
    'jade:index',
    'jade:pages',
    'jade:views'
]);




//---------------
// WATCH
//---------------

gulp.task('watch', function() {
    log('Starting watch and LiveReload..');

    $plugins.livereload.listen();
    gulp.watch(serverdata.watch,['server']);
    gulp.watch(source.i18n.watch, ['i18n']);
    gulp.watch(source.jade.watch, ['jade']);
    gulp.watch(source.less.watch, ['styles:less:app', 'styles:less:app-rtl']);
    gulp.watch(source.scripts.watch, ['scripts:app']);

});

// Rerun the task when a file changes
gulp.task('watch2', function() {
    log('Starting watch and LiveReload..');

    $plugins.livereload.listen();

    gulp.watch(source.jade.watch,['jade']);

    // a delay before triggering browser reload to ensure everything is compiled
    var livereloadDelay = 500;
    // list of source file to watch for live reload
    var watchSource = [].concat(
        source.jade.watch
    );

    gulp.watch(watchSource)
        .on('change', function(event) {
            setTimeout(function() {
                $plugins.livereload.changed( event.path );
            }, livereloadDelay);
        });

});

//---------------
// CLEAN
//---------------
// Remove all files from the build paths
gulp.task('clean', function(done) {
    log('Cleaning: ' + $plugins.util.colors.blue(isProduction ? delconfig.production : delconfig.develop));
    // force: clean files outside current directory
    del(isProduction ? delconfig.production : delconfig.develop, {force: true}, done);
});

//---------------
// Targets
//---------------

// build for production (minify)
gulp.task('production', gulpsync.sync([
    'prod',
    'bower',
    'vendor',
    'server',
    'images',
    'i18n',
    'styles',
    'scripts',
    'jade'
]), function(){

    log('************');
    log('* 发布成功 *');
    log('************');

});

gulp.task('prod', function() {
    log('Starting production build...');
    isProduction = true;
});

// build for develop (no minify)
gulp.task('develop', gulpsync.sync([
    'bower',
    'vendor',
    'server',
    'images',
    'i18n',
    'styles',
    'scripts',
    'jade',
    'watch'
]), function(){

    log('************');
    //log('* All Done * You can start editing your code, LiveReload will update your browser after any change..');
    log('* 执行成功..');
    log('************');

});

gulp.task('default',['develop']);


/////////////////////


// Error handler
function handleError(err) {
    log(err.toString());
    this.emit('end');
}

// log to console using
function log(msg) {
    $plugins.util.log( $plugins.util.colors.blue( msg ) );
}