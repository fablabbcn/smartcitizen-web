(function() {
  'use strict';

  angular.module('app')
    .config(config);
    
    config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', 'RestangularProvider'];
    function config($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider) {
      $stateProvider
        .state('landing', {
          url: '/',
          template: 'hola'
        })
        .state('home', {
          url: '',
          abstract: true,
          views: {
            '': {
              templateUrl: 'app/components/home/template.html'
            },

            /*'alerts@home': {
              templateUrl: 'app/components/alert/alert.html',
              controller: 'AlertController',
              controllerAs: 'vm'
            }*/
          }
        })
        .state('home.kit', {
          url: '/home',
          views: {
            'container@landing':  {
              templateUrl: 'app/components/home/home.html'
            }
          }
        });
        /*

        .state('home', {
          url: '/',
        });*/

      $urlRouterProvider.otherwise('/');

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('!');

      RestangularProvider.setBaseUrl('https://new-api.smartcitizen.me/v0');
    }
})();
