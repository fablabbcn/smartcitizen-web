import angular from 'angular';

// local modules
import components from './components';
import core from './core';

// external modules
import uiRouter from 'angular-ui-router';
import ngSanitize from 'angular-sanitize';
import ngCookies from 'angular-cookies';
import ngFileUpload from 'ng-file-upload';
import ngMaterial from 'angular-material';
import restangular from 'restangular';
import { angularSpinner } from 'angular-spinner';
import 'angular-dropdowns';
import 'oauth-ng';
import 'angular-leaflet-directive';
import angularLoad from 'angular-load';
import angulartics from 'angulartics';
import angularticsGoogleAnalytics from 'angulartics-google-analytics';
import clipboardModule from 'angular-clipboard';
import 'ngtweet';
import 'angular-socket-io';
import ngStorage  from 'ngstorage';

// // no-ng stuff
// import 'pickadate';

// config
import route from './app.route';
import run from './app.run';

angular.module('app', [
  components,
  core,
  ngFileUpload, // TODO: version migration
	ngMaterial,
	uiRouter,
	restangular,
  angularSpinner.name,
  'ngDropdowns',
  'oauth',
  ngStorage.name,
  'leaflet-directive',
  angularLoad,
  angulartics,
  angularticsGoogleAnalytics,
  ngSanitize,
  clipboardModule.name,
  ngCookies,
  'ngtweet',
  'btford.socket-io'
])
.config(route)
// .run(run);
