'use strict';

angular.module('smartcitiesApp', ['restangular', 'ui.router', 'ngMaterial', 'oauth'])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode({
	  enabled: true,
	  requireBase: false
	}).hashPrefix('!');
  })
;
