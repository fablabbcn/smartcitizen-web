(function() {
  'use strict';

  angular.module('app')
    .config(config);
    
    config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', 'RestangularProvider'];
    function config($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider) {
      $stateProvider
        
        .state('landing', {
          url: '/',
          resolve: {
            location: function(geolocation) {
              var positionObj = geolocation.getPositionObj();
              if(positionObj) {
                return positionObj;
              }

              return geolocation.callAPI().then(function(data) {
                var arrLoc = data.data.loc.split(',');
                var location = {
                  lat: parseFloat(arrLoc[0]),
                  lng: parseFloat(arrLoc[1])
                };
                return location;
              });
            },
            initialMarkers: function($state, device, location) {
              console.log('position', location);

              return device.getDevices(location).then(function(data) {
                data = data.plain();
                console.log('data', data);

                $state.go('home', {id: data[0].id});
              });
            }
          }
        })
        .state('home', {
          url: '/kits/:id',
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
            initialMarkers: function($state, device, location) {
              console.log('position', location);

              return device.getDevices(location).then(function(data) {
                data = data.plain();
                console.log('data', data);

                var markers = data.map(function(device) {
                  var obj = {
                    id: device.id,
                    lat: device.data.location.latitude,
                    lng: device.data.location.longitude,
                    message: 'Hola',
                    status: device.status
                  };
                  return obj;
                });
                return markers;
              });
            }
          }
        });

      $urlRouterProvider.otherwise('/');

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('!');

      RestangularProvider.setBaseUrl('https://new-api.smartcitizen.me/v0');
    }
})();
