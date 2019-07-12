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
]).config(function($mdThemingProvider) {

  $mdThemingProvider.definePalette('customGreyPalette', {
    '50': '#d4d4d4',
    '100': '#d4d4d4',
    '200': '#d4d4d4',
    '300': '#d4d4d4',
    '400': '#fbfbfb',
    '500': '#aeaeae',
    '600': '#d4d4d4',
    '700': '#d4d4d4',
    '800': '#bbbbbb',
    '900': '#c8c8c8',
    'A100': '#d4d4d4',
    'A200': '#d4d4d4',
    'A400': '#d4d4d4',
    'A700': '#aeaeae',
    'contrastDefaultColor': 'dark'
  });

  $mdThemingProvider.definePalette('customYellowPalette', {
    '50': '#b08406',
    '100': '#c89707',
    '200': '#e1a908',
    '300': '#f6ba0c',
    '400': '#f7c125',
    '500': '#f8c83d',
    '600': '#fad66f',
    '700': '#fbdd87',
    '800': '#fce4a0',
    '900': '#fcebb8',
    'A100': '#fad66f',
    'A200': '#f9cf56',
    'A400': '#f8c83d',
    'A700': '#fdf2d1'
  });

  $mdThemingProvider.definePalette('customRedPalette', {
    '50': '#fbb6bc',
    '100': '#f99ea6',
    '200': '#f8858f',
    '300': '#f76d79',
    '400': '#f55563',
    '500': '#F43D4D',
    '600': '#f76d79',
    '700': '#f55563',
    '800': '#F43D4D',
    '900': '#c00b1b',
    'A100': '#fcced2',
    'A200': '#fee6e8',
    'A400': '#fffefe',
    'A700': '#a80a17',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100']
  });

  $mdThemingProvider.theme('default')
    .primaryPalette('customGreyPalette')
    .accentPalette('customYellowPalette')
    .warnPalette('customRedPalette');
});

// Here you can define a custom Palette:
// Theme configuration: https://material.angularjs.org/latest/Theming/03_configuring_a_theme
