'use strict';


angular.module('app', [
  'ngFileUpload',
	'ngMaterial',
	'ui.router',
	'restangular',
  'angularSpinner',
  'ngDropdowns',
  'oauth',
  'leaflet-directive',
	'app.components',
  'papa-promise',
  'angularLoad',
  'angulartics',
  'angulartics.google.analytics',
  'ngSanitize',
  'angular-clipboard',
  'ngCookies',
  'ngMessages',
  'ngtweet',
  'btford.socket-io',
  'ngAnimate'
]).config(function($mdThemingProvider){
  $mdThemingProvider.theme('default')
    .primaryPalette('indigo')
    .accentPalette('amber');
});

// Here you can define a custom Palette:
// Theme configuration: https://material.angularjs.org/latest/Theming/03_configuring_a_theme
