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
                return _.chain(data)
                  .map(function(device) {
                    return new Marker(device);
                  })
                  .filter(function(marker) {
                    return !!marker.lng && !!marker.lat;
                  })
                  .value();
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
          // onEnter: function() {
          //   window.scrollTo(0,0);
          // },
          resolve: {
            kitData: function($stateParams, device, marker, FullKit, animation) {
              return device.getDevice($stateParams.id)
                .then(function(deviceData) {
                  var markerLocation = {lat: deviceData.data.location.latitude, lng: deviceData.data.location.longitude};
                  animation.kitLoaded(markerLocation);
                  return new FullKit(deviceData);
                });
            },
            ownerKits: function(kitData, PreviewKit, $q, device) {
              var kitIDs = kitData.owner.kits;

              return $q.all(
                kitIDs.map(function(id) {
                  return device.getDevice(id)
                    .then(function(data) {
                      return new PreviewKit(data);
                    });
                })
              );
            },
            belongsToUser: function($stateParams, auth, marker) {
              if(!auth.isAuth()) return false;
              var kitID = parseInt($stateParams.id);
              var authUserKits = auth.getCurrentUser().data && auth.getCurrentUser().data.kits;
              var isAdmin = auth.getCurrentUser().data && auth.getCurrentUser().data.role === 'admin';

              return isAdmin || _.some(authUserKits, function(kit) {
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
          // onEnter: function() {
          //   window.scrollTo(0,0);
          // },
          resolve: {
            isCurrentUser: function($stateParams, $location, auth) {
              if(!auth.isAuth()) return false;
              var userID = parseInt($stateParams.id);
              var authUserID = auth.getCurrentUser().data && auth.getCurrentUser().data.id;
              if(userID === authUserID) {
                $location.path('/profile');
              }
            },
            userData: function($stateParams, $state, NonAuthUser, user, auth) {
              var id = $stateParams.id;

              return user.getUser(id)
                .then(function(user) {
                  return new NonAuthUser(user); 
                });
            },
            kitsData: function(utils, userData) {
              var kitIDs = _.pluck(userData.kits, 'id');
              if(!kitIDs.length) {
                return [];
              };

              return utils.getOwnerKits(kitIDs)
                .then(function(userKits) {
                  return userKits;
                });
            }
            /*
            isAdmin: function() {
              var isAdmin = auth.getCurrentUser().data && auth.getCurrentUser().data.role === 'admin';
              if(isAdmin) return true;
              return false;
            },
            */
          }
        })
        .state('myProfile', {
          url: '/profile',
          authenticate: true,
          templateUrl: 'app/components/myProfile/myProfile.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          // onEnter: function() {
          //   window.scrollTo(0,0);
          // },
          resolve: {
            userData: function(user, auth) {
              var userData = auth.getCurrentUser().data;
              if(!userData) return;
              return userData;
            }
          } 
        })
        .state('login', {
          url: '/login',
          authenticate: false,
          resolve: {
            isAuth: function(){

            },
            buttonToClick: function($location, isAuth) {
              if(isAuth) {
                return $location.path('/');
              }
              $location.path('/kits/667');
              $location.search('login', 'true');
            }
          }
        })
        .state('signup', {
          url: '/signup',
          authenticate: false,
          resolve: {
            isAuth: function() {

            },
            buttonToClick: function($location, isAuth) {
              if(isAuth) {
                return $location.path('/');
              }
              $location.path('/kits/667');
              $location.search('signup', 'true');
            }
          }
        })
        .state('logout', {
          url: '/logout',
          authenticate: true,
          resolve: {
            logout: function($location, $state, auth, $rootScope) {
              auth.logout();
              $location.path('/');
              $rootScope.$broadcast('loggedOut');
            }
          }
        })
        .state('passwordRecovery', {
          url: '/password_recovery/:code',
          templateUrl: 'app/components/passwordReset/passwordReset.html',
          controller: 'PasswordResetController',
          controllerAs: 'vm'
        });

      $urlRouterProvider.otherwise('/');

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('!');

      RestangularProvider.setBaseUrl('https://new-api.smartcitizen.me/v0');
    }
})();
