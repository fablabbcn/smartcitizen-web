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
            markers: function($state, device, location, utils, sensorTypes, Kit, Marker) {

              return device.getAllDevices().then(function(data) {
                return data.map(function(device) {
                  return new Marker(device);
                })
              });
              /*return device.getDevices(location).then(function(data) {
                data = data.plain();

                var markers = data.map(function(device) {
                  // var parsedKit = utils.parseKit(device);

                  // var obj = {
                  //   lat: device.data.location.latitude,
                  //   lng: device.data.location.longitude,
                  //   message: '<div class="popup"><div class="popup_top ' + parsedKit.kitClass + '"><p class="popup_name">' + parsedKit.kitName + '</p><p class="popup_type">' + parsedKit.kitType + '</p><p class="popup_time"><md-icon md-svg-src="./assets/images/update_icon.svg"></md-icon>' + parsedKit.kitLastTime + '</p></div><div class="popup_bottom"><p class="popup_location"><md-icon md-svg-src="./assets/images/location_icon.svg"></md-icon>' + parsedKit.kitLocation + '</p><div class="popup_labels"><span>' + parsedKit.kitLabels.status + '</span><span>' + parsedKit.kitLabels.exposure + '</span></div></div></div>',
                  //   status: device.status,
                  //   myData: {
                  //     id: device.id
                  //   }
                  // };

                  var obj = new Marker(device);
                  return obj;
                });
                return markers;
              });*/
            }/*,
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

            }*/
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
            marker: function($stateParams, device, marker, Marker, animation) {

              return device.getDevice($stateParams.id)
                .then(function(deviceData) {
                  console.log('d', deviceData);
                  var markerLocation = {lat: deviceData.data.location.latitude, lng: deviceData.data.location.longitude};
                  animation.kitLoaded(markerLocation);
                  return deviceData;
                });
            },
            belongsToUser: function($stateParams, auth, marker) {
              if(!auth.isAuth()) return false;
              var kitID = $stateParams.id;
              var authUserKits = auth.getCurrentUser().data.kits;
              return _.some(authUserKits, function(kit) {
                return kitID === kit.id;
              });
            }
          }
        })

        .state('userProfile', {
          url: '/users/:id',
          templateUrl: 'app/components/userProfile/userProfile.html',
          controller: 'UserProfileController',
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
        })
        .state('myProfile', {
          url: '/profile',
          authenticate: true,
          templateUrl: 'app/components/myProfile/myProfile.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            authUser: function(user, auth) {
              var userData = auth.getCurrentUser().data;
              console.log('u', userData);
              if(!userData) return;
              return userData;
              // return user.getUser()
              //   .then(function(user) {
              //     return user;
              //   });
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
