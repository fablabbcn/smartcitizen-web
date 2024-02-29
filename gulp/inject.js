'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;

module.exports = function(options) {
  gulp.task('inject', ['scripts', 'styles'], function () {
    var injectStyles = gulp.src([
      options.tmp + '/serve/app/**/*.css',
      '!' + options.tmp + '/serve/app/vendor.css'
    ], { read: false });

    var injectScripts = gulp.src([
      options.src + '/app/**/*.js',
      // '!' + options.src + '/app/components/kit/setupModule/scktool-app.js',
      // '!' + options.src + '/app/components/kit/setupModule/scktool-connector.js',
      '!' + options.src + '/app/**/*.spec.js',
      '!' + options.src + '/app/**/*.mock.js'
    ])
    .pipe($.angularFilesort()).on('error', options.errorHandler('AngularFilesort'));

    var injectOptions = {
      ignorePath: [options.src, options.tmp + '/serve'],
      addRootSlash: false
    };

    return gulp.src(options.src + '/*.html')
      .pipe($.inject(injectStyles, injectOptions))
      .pipe($.inject(injectScripts, injectOptions))
      // .pipe($.inject(injectModule, injectOptions))
      .pipe(wiredep(options.wiredep))
      .pipe(gulp.dest(options.tmp + '/serve'));

  });

  // TODO: Refactor, check
  // gulp.task('inject:scktool', ['inject'], function() {
  //   return gulp.src([
  //     options.src + '/app/components/kit/setupModule/scktool-app.js',
  //     options.src + '/app/components/kit/setupModule/scktool-connector.js'
  //   ])
  //   .pipe(gulp.dest(options.tmp + '/serve/scripts/'));
  // });

  // gulp.task('inject:dev', function() {

  //   var injectModule = gulp.src([
  //     options.src + '/app/components/kit/setupModule/scktool-app.js',
  //     options.src + '/app/components/kit/setupModule/scktool-connector.js'
  //   ]);

  //   var injectOptions = {
  //     ignorePath: [options.src, options.tmp + '/serve'],
  //     addRootSlash: false
  //   };

  //   return gulp.src(options.src + '/*.html')
  //     .pipe($.inject(injectModule, injectOptions));

  // });
};
