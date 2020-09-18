'use strict';

var gulp = require('gulp');
var replace = require('replace');
var log = require('fancy-log');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

module.exports = function(options) {
  gulp.task('partials', function () {
    return gulp.src([
      options.src + '/app/**/*.html',
      options.tmp + '/serve/app/**/*.html'
    ])
      .pipe($.htmlmin({ collapseWhitespace: true }))
      .pipe($.angularTemplatecache('templateCacheHtml.js', {
        module: 'app',
        root: 'app'
      }))
      .pipe(gulp.dest(options.tmp + '/partials/'));
  });

  gulp.task('html', ['inject', 'partials'], function () {
    var partialsInjectFile = gulp.src(options.tmp + '/partials/templateCacheHtml.js', { read: false });
    var partialsInjectOptions = {
      starttag: '<!-- inject:partials -->',
      ignorePath: options.tmp + '/partials',
      addRootSlash: false
    };

    var htmlFilter = $.filter('*.html', {restore: true});
    var jsFilter = $.filter(['**/*.js', '!'+options.src+'/**/scktool-*.js'], {restore: true});
    var cssFilter = $.filter('**/*.css', {restore: true});
    var assets;

    return gulp.src(options.tmp + '/serve/*.html')
      .pipe($.inject(partialsInjectFile, partialsInjectOptions))
      .pipe(assets = $.useref())
      .pipe($.rev())
      .pipe(jsFilter)
      .pipe($.ngAnnotatePatched())
      .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', options.errorHandler('Uglify'))
      .pipe(jsFilter.restore)
      .pipe(cssFilter)
      .pipe($.csso())
      .pipe(cssFilter.restore)
      .pipe(assets)
      .pipe($.useref())
      .pipe($.revReplace())
      .pipe(htmlFilter)
      .pipe($.htmlmin({
        collapseWhitespace: true,
        removeComments: true
      }))
      .pipe(htmlFilter.restore)
      // Creates 404.html with app index content
      // A 404.html is need it for gh-pages to deal with routing
      .pipe($.rename(function(path) {
          if (path.dirname == '.' && path.extname == '.html') {
            path.basename = '404';
          }
      }))
      .pipe(gulp.dest(options.dist + '/'))
      // Creates index.html with app index content
      .pipe($.rename(function(path) {
          if (path.dirname == '.' && path.extname == '.html') {
            path.basename = 'index';
          }
      }))
      .pipe(gulp.dest(options.dist + '/'))
      .pipe($.size({ title: options.dist + '/', showFiles: true }));
  });

  // Only applies for fonts from bower dependencies
  // Custom fonts are handled by the "other" task
  gulp.task('fonts', function () {
    return gulp.src($.mainBowerFiles())
      .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
      .pipe($.flatten())
      .pipe(gulp.dest(options.dist + '/fonts/'));
  });

  gulp.task('other', function () {
    return gulp.src([
      options.src + '/**/*',
      '!' + options.src + '/**/*.{html,css,js,scss}'
    ])
      .pipe(gulp.dest(options.dist + '/'));
  });


  gulp.task('version', function(){
    var p = require('./../package.json');
    var gr = require('git-rev');
    log(' -- The version is now: ' + p.version);

    gr.short(function(str){
      if (str.length > 1){
        log('-- Hash is:' + str);
        replace({
          regex: "Hash.*",
          replacement: "Hash: " + str,
          paths: ['./src/app/components/footer/footer.html'],
          recursive: true,
          silent: true,
          });
      }
    });

    replace({
      regex: "Version.*",
      replacement: "Version: " + p.version,
      paths: ['./src/app/components/footer/footer.html'],
      recursive: true,
      silent: true,
    });

  });


  gulp.task('clean', function (done) {
    $.del([options.dist + '/', options.tmp + '/'], done);
  });

  gulp.task('external-assets', function() {
    return gulp.src(['bower_components/leaflet/dist/images/**'])
      .pipe(gulp.dest(options.dist + '/styles/images'));
  });

  gulp.task('oldModule-js', function() {
    return gulp.src([
      options.src + '/app/components/kit/setupModule/scktool-app.js',
      options.src + '/app/components/kit/setupModule/scktool-connector.js'
    ])
      .pipe(gulp.dest(options.dist + '/scripts/'));
  });

  gulp.task('build', ['html', 'fonts', 'other', 'external-assets', 'oldModule-js', 'version']);
};
