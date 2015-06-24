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
            sensorTypes: function(sensor) {

              return sensor.callAPI()
                .then(function(sensorTypes) {
                  sensorTypes = sensorTypes.plain();
                  //sensor.setTypes(sensorTypes);
                  return sensorTypes;
                });
            },
            initialMarkers: function($state, device, location, utils, sensorTypes, Kit) {

              return device.getDevices(location).then(function(data) {
                data = data.plain();

                var markers = data.map(function(device) {
                  var parsedKit = utils.parseKit(device);

                  var obj = {
                    lat: device.data.location.latitude,
                    lng: device.data.location.longitude,
                    message: '<div class="popup"><div class="popup_top ' + parsedKit.kitClass + '"><p class="popup_name">' + parsedKit.kitName + '</p><p class="popup_type">' + parsedKit.kitType + '</p><p class="popup_time"><md-icon md-svg-src="./assets/images/update_icon.svg"></md-icon>' + parsedKit.kitLastTime + '</p></div><div class="popup_bottom"><p class="popup_location"><md-icon md-svg-src="./assets/images/location_icon.svg"></md-icon>' + parsedKit.kitLocation + '</p><div class="popup_labels"><span>' + parsedKit.kitLabels.status + '</span><span>' + parsedKit.kitLabels.exposure + '</span></div></div></div>',
                    status: device.status,
                    myData: {
                      id: device.id
                    }
                  };
                  return obj;
                });
                return markers;
              });
            },
            initialPopup: function(leafletData, initialMarkers) {
              var closestMarkerID = initialMarkers[0].myData.id;

              leafletData.getMap()
                .then(function(data) {
                  for(var layer in data._layers) {
                    if(!data._layers[layer].options.myData) {
                      continue;
                    }

                    var ID = data._layers[layer].options.myData.id;
                    if(ID === closestMarkerID) {
                      angular.element(data._layers[layer]._icon).click();
                    }
                  }
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

              return device.getDevice($stateParams.id)
                .then(function(data) {
                  data = data.plain();
                  marker.setCurrentMarker(data);
                  marker.dataLoaded();
                  return data;
                });
            }
          }
        })

        .state('profile', {
          url: '/users/:id',
          templateUrl: 'app/components/profile/profile.html',
          controller: 'ProfileController',
          controllerAs: 'vm',
          resolve: {
            userData: function($stateParams, user) {
              var id = $stateParams.id;
              return user.getUser(id)
                .then(function(user) {
                  return user;
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
