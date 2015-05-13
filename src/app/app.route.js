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
          },
          resolve: {
            location: function(geolocation) {
              return geolocation.callAPI().then(function(data) {
                var arrLoc = data.data.loc.split(',');
                var location = {
                  lat: parseFloat(arrLoc[0]),
                  lng: parseFloat(arrLoc[1])
                };
                return location;
              });
            },
            initialMarkers: function(device, location) {
              console.log('position', location);

              return device.getDevices(location).then(function(data) {
                data = data.plain();
                
                var markers = data.map(function(device) {
                  var obj = {
                    lat: device.data.location.latitude,
                    lng: device.data.location.longitude,
                    message: 'Hola'
                  };
                  return obj;
                });
                return markers;
              });
            }
          }
        });

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
