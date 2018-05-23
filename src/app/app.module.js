import angular from 'angular';
// locals modules
import components from './components';
import core from './core';
// external modules

// config
import route from './app.route';
import run from './app.config';

angular.module('app', [
  components,
  core,
  'ngFileUpload',
	'ngMaterial',
	'ui.router',
	'restangular',
  'angularSpinner',
  'ngDropdowns',
  'oauth',
  'leaflet-directive',
  'angularLoad',
  'angulartics',
  'angulartics.google.analytics',
  'ngSanitize',
  'angular-clipboard',
  'ngCookies',
  'ngtweet',
  'btford.socket-io'
])
.config(route)
.run(run);
