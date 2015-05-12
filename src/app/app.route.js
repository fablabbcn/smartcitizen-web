(function() {
  'use strict';

  angular.module('app')
    .config(config);
    
    config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', 'RestangularProvider'];
    function config($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider) {
      $stateProvider
        .state('landing', {
          url: '/landing',
          template: 'hola'
        })
        .state('home', {
          url: '/',
          views: {
            '': {
              templateUrl: 'app/components/home/template.html'
            },

            'map@home': {
              templateUrl: 'app/components/map/map.html',
              controller: 'MapController',
              controllerAs: 'vm'
            },
            'kit@home': {
              templateUrl: 'app/components/kit/kit.html',
              controller: 'KitController',
              controllerAs: 'vm'
            }
          }
        })

        /*.state('home.kit', {
          url: '/home',
          views: {
            'container@landing':  {
              templateUrl: 'app/components/home/home.html'
            }
          }
        });

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
