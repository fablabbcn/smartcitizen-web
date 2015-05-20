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

              return device.getDevices(location).then(function(data) {
                data = data.plain();
                
                var closestMarker = data[0];
                $state.go('home.kit', {id: closestMarker.id});
              });
            }
          }
        })
        .state('home', {
          url: '',
          abstract: true,
          views: {
            '': {
              templateUrl: 'app/components/home/template.html'
            },

            'map@home': {
              templateUrl: 'app/components/map/map.html',
              controller: 'MapController',
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
            initialMarkers: function($state, device, location, utils) {

              return device.getDevices(location).then(function(data) {
                data = data.plain();

                var markers = data.map(function(device) {
                  var parsedKit = utils.parseKit(device);

                  var obj = {
                    lat: device.data.location.latitude,
                    lng: device.data.location.longitude,
                    message: '<div class="popup"><div class="popup_top ' + parsedKit.kitClass + '"><p class="popup_name">' + parsedKit.kitName + '</p><p class="popup_type">' + parsedKit.kitType + '</p><p class="popup_time"><md-icon md-svg-src="http://fablabbcn.github.io/smartcitizen-web/assets/images/update_icon.svg"></md-icon>' + parsedKit.kitLastTime + '</p></div><div class="popup_bottom"><p class="popup_location"><md-icon md-svg-src="http://fablabbcn.github.io/smartcitizen-web/assets/images/location_icon.svg"></md-icon>' + parsedKit.kitLocation + '</p><div class="popup_labels"><span>' + parsedKit.kitLabels.status + '</span><span>' + parsedKit.kitLabels.exposure + '</span></div></div></div>',
                    status: device.status,
                    myData: {
                      id: device.id
                    }
                  };
                  return obj;
                });
                return markers;
              });
            }
          }
        })

        .state('home.kit', {
          url: '/kits/:id',
          views: {
            'container@home': {
              templateUrl: 'app/components/kit/kit.html',
              controller: 'KitController',
              controllerAs: 'vm'
            }
          },
          resolve: {
            marker: function($stateParams, device, marker) {
              device.getDevice($stateParams.id)
                .then(function(data) {

                  data = data.plain();
                  marker.setCurrentMarker(data);
                  marker.dataLoaded();
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
