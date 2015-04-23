angular.module('smartcitiesApp')
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/core/main.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode({
	  enabled: true,
	  requireBase: false
	}).hashPrefix('!');
  })