'use strict';

angular.module('app')
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider) {
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

    RestangularProvider.setBaseUrl('https://new-api.smartcitizen.me/v0');
  });