angular.module('smartcitiesApp')
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/core/main.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('/');
  })