'use strict';

angular.module('smartcitiesApp')
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/core/main.html',
        controller: 'MainCtrl'
      })

      .state('test', {
        url: '/test',
        templateUrl: 'app/core/html/signup.html'
      });

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode({
  	  enabled: true,
  	  requireBase: false
  	}).hashPrefix('!');
  });