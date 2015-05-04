'use strict';

angular.module('app')
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/components/home/home.html',
        controller: ''
      })

      .state('test', {
        url: '/test',
        templateUrl: 'app/core/html/passwordRecovery.html'
      });

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode({
  	  enabled: true,
  	  requireBase: false
  	}).hashPrefix('!');

    RestangularProvider.setBaseUrl('https://new-api.smartcitizen.me/v0');
  });