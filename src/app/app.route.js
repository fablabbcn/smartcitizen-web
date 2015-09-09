(function() {
  'use strict';

  angular.module('app')
    .config(config);

    /*
      Check app.config.js to know how states are protected
    */
    
    config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', 'RestangularProvider', '$logProvider'];
    function config($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider, $logProvider) {
      $stateProvider
        /*
         -- Landing state -- 
         Grabs your location and redirects you to the closest marker with data
        */
        .state('landing', {
          url: '/',
          resolve: {
            location: function(geolocation) {
              var positionObj = geolocation.getPositionObj();
              if(positionObj) {
                return positionObj;
              }

              return geolocation.callAPI()
                .then(function(data) {
                  var arrLoc = data.data.loc.split(',');
                  var location = {
                    lat: parseFloat(arrLoc[0]),
                    lng: parseFloat(arrLoc[1])
                  };
                  return location;
                })
                .catch(function(err) {
                  throw new Error(err);
                });
            },
            initialMarkers: function($state, device, location, HasSensorKit) {
              console.log('lo', location);
              if(!location || (!location.lat || !location.lng) ) {
                // set hard-coded location
                location = {
                  lat: 41.3860,
                  lng: 2.1482 
                };
              }
              return device.getDevices(location).then(function(data) {
                data = data.plain();

                _(data)
                  .chain()
                  .map(function(device) {
                    return new HasSensorKit(device);
                  })
                  .filter(function(kit) {
                    return !!kit.longitude && !!kit.latitude;
                  })
                  .find(function(kit) {
                    return kit.sensorsHasData();
                  })
                  .tap(function(closestKit) {
                    if(closestKit) {
                      $state.go('layout.home.kit', {id: closestKit.id});                                          
                    } else {
                      $state.go('layout.home.kit', {id: data[0].id});
                    }
                  })
                  .value();
              });
            }
          }
        })
        /*
        -- Layout state --
        Top-level state used for inserting the layout(navbar and footer)
        */
        .state('layout', {
          url: '',
          abstract: true,
          templateUrl: 'app/components/layout/layout.html',
          controller: 'LayoutController',
          controllerAs: 'vm'
        })

        .state('layout.kitEdit', {
          url: '/kits/edit/:id',
          templateUrl: 'app/components/kit/editKit/editKit.html',
          controller: 'EditKitController',
          controllerAs: 'vm',
          resolve: {
            belongsToUser: function(auth, $location, $stateParams, userUtils, kitUtils, $window, AuthUser) {
              if(!auth.isAuth()) {
                $location.path('/');
                return;
              }
              var kitID = parseInt($stateParams.id);
              var userData = ( auth.getCurrentUser().data ) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser( JSON.parse( $window.localStorage.getItem('smartcitizen.data') )));
              var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
              var isAdmin = userUtils.isAdmin(userData);

              if(!isAdmin && !belongsToUser) {
                $location.path('/');
              }
            },
            kitData: function($stateParams, device, FullKit) {
              var kitID = $stateParams.id;

              return device.getDevice(kitID)
                .then(function(deviceData) {
                  return new FullKit(deviceData);
                });
            }
          }
        })

        .state('layout.kitAdd', {
          url: '/kits/new', 
          templateUrl: 'app/components/kit/newKit/newKit.html',
          controller: 'NewKitController',
          controllerAs: 'vm'
        })

        /*
        -- Home state --
        Nested inside the layout state
        It contains the map and all the data related to it
        Abstract state, it only activates when there's a child state activated
        */
        .state('layout.home', {
          url: '/kits',
          abstract: true,
          views: {
            '': {
              templateUrl: 'app/components/home/template.html'
            },

            'map@layout.home': {
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
                  return sensorTypes.plain();
                });
            },
            markers: function($state, device, location, utils, Kit, Marker) {
              // It could be refactor to use HTTP caching instead of holding them in localstorage
              var worldMarkers = device.getWorldMarkers();
              if(worldMarkers && worldMarkers.length) {
                return worldMarkers;
              }
              return device.getAllDevices().then(function(data) {
                return _.chain(data)
                  .map(function(device) {
                    return new Marker(device);
                  })
                  .filter(function(marker) {
                    return !!marker.lng && !!marker.lat;
                  })
                  .tap(function(data) {
                    device.setWorldMarkers(data);
                  })
                  .value();
              });
            }
          }
        })
        /*
        -- Show Kit state --
        Nested inside layout and home state
        It's the state that displays all the data related to a kit below the map
        */
        .state('layout.home.kit', {
          url: '/:id',
          views: {
            'container@layout.home': {
              templateUrl: 'app/components/kit/showKit/showKit.html',
              controller: 'KitController',
              controllerAs: 'vm'
            }
          },

          resolve: {
            kitData: function($stateParams, device, FullKit) {
              var kitID = $stateParams.id;

              return device.getDevice(kitID)
                .then(function(deviceData) {
                  return new FullKit(deviceData);
                });
            },
            mainSensors: function(kitData, sensorTypes) {
              return kitData.getSensors(sensorTypes, {type: 'main'});
            },
            compareSensors: function(kitData, sensorTypes) {
              return kitData.getSensors(sensorTypes, {type: 'compare'});
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
            belongsToUser: function($window, $stateParams, auth, AuthUser, kitUtils, userUtils) {
              if(!auth.isAuth()) {
                return false;
              }
              var kitID = parseInt($stateParams.id);
              var userData = ( auth.getCurrentUser().data ) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser( JSON.parse( $window.localStorage.getItem('smartcitizen.data') )));
              var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
              var isAdmin = userUtils.isAdmin(userData);

              return isAdmin || belongsToUser;
            }
          }
        })
        /*
        -- User Profile state --
        Nested inside layout state
        Public profile of a given user
        Redirects to My Profile/My Profile Admin if the user is the one authenticated or if the authenticated user is an admin
        */
        .state('layout.userProfile', {
          url: '/users/:id',
          templateUrl: 'app/components/userProfile/userProfile.html',
          controller: 'UserProfileController',
          controllerAs: 'vm',
          resolve: {
            isCurrentUser: function($stateParams, $location, auth) {
              if(!auth.isAuth()) {
                return;
              }
              var userID = parseInt($stateParams.id);
              var authUserID = auth.getCurrentUser().data && auth.getCurrentUser().data.id;
              if(userID === authUserID) {
                $location.path('/profile');
              }
            },
            userData: function($stateParams, $state, NonAuthUser, user) {
              var id = $stateParams.id;

              return user.getUser(id)
                .then(function(user) {
                  return new NonAuthUser(user); 
                });
            },
            kitsData: function($q, device, PreviewKit, userData) {
              var kitIDs = _.pluck(userData.kits, 'id');
              if(!kitIDs.length) {
                return [];
              }

              return $q.all(
                kitIDs.map(function(id) {
                  return device.getDevice(id)
                    .then(function(data) {
                      return new PreviewKit(data);
                    });
                })
              );
            },          
            isAdmin: function($window, $location, $stateParams, auth, AuthUser) {
              var userRole = (auth.getCurrentUser().data && auth.getCurrentUser().data.role) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )).role);
              if(userRole === 'admin') {
                var userID = $stateParams.id;
                $location.path('/profile/' + userID);
              } else {
                return false;                
              } 
            }
          }
        })
        /*
        -- My Profile state --
        Private profile of the authenticated user at the moment
        */
        .state('layout.myProfile', {
          url: '/profile',
          authenticate: true,
          templateUrl: 'app/components/myProfile/myProfile.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            userData: function($location, $window, user, auth, AuthUser) {
              var userData = (auth.getCurrentUser().data) || ( $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )));
              if(!userData) {
                return;
              }
              return userData;
            },
            kitsData: function($q, device, PreviewKit, userData) {
              var kitIDs = _.pluck(userData.kits, 'id');
              if(!kitIDs.length) {
                return [];
              }

              return $q.all(
                kitIDs.map(function(id) {
                  return device.getDevice(id)
                    .then(function(data) {
                      return new PreviewKit(data);
                    });
                })
              );
            }
          } 
        })
        /*
        -- My Profile Admin --
        State to let admins see private profiles of users with full data
        */
        .state('layout.myProfileAdmin', {
          url: '/profile/:id',
          authenticate: true,
          templateUrl: 'app/components/myProfile/myProfile.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            isAdmin: function($window, auth, $location, AuthUser) {
              var userRole = (auth.getCurrentUser().data && auth.getCurrentUser().data.role) || ( $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )).role );
              if(userRole !== 'admin') {
                $location.path('/');
              } else {
                return true;
              }
            },
            userData: function($stateParams, user, auth, AuthUser) {
              var userID = $stateParams.id;
              return user.getUser(userID)
                .then(function(user) {
                  return new AuthUser(user);
                });
            },
            kitsData: function($q, device, PreviewKit, userData) {
              var kitIDs = _.pluck(userData.kits, 'id');
              if(!kitIDs.length) {
                return [];
              }

              return $q.all(
                kitIDs.map(function(id) {
                  return device.getDevice(id)
                    .then(function(data) {
                      return new PreviewKit(data);
                    });
                })
              );
            }
          }
        })
        /*
        -- Login --
        It redirects to a certain kit state and opens the login dialog automatically
        */
        .state('layout.login', {
          url: '/login',
          authenticate: false,
          resolve: {
            buttonToClick: function($location, auth) {
              if(auth.isAuth()) {
                return $location.path('/');
              }
              $location.path('/kits/667');
              $location.search('login', 'true');
            }
          }
        })
        /*
        -- Signup --
        It redirects to a certain kit state and opens the signup dialog automatically
        */
        .state('layout.signup', {
          url: '/signup',
          authenticate: false,
          resolve: {
            buttonToClick: function($location, auth) {
              if(auth.isAuth()) {
                return $location.path('/');
              }
              $location.path('/kits/667');
              $location.search('signup', 'true');
            }
          }
        })
        /*
        -- Logout --
        It removes all the user data from localstorage and redirects to landing state
        */
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
        /*
        -- Password Recovery --
        Form to input your email address to receive an email to reset your password
        */
        .state('passwordRecovery', {
          url: '/password_recovery',
          authenticate: false,
          templateUrl: 'app/components/passwordRecovery/passwordRecovery.html',
          controller: 'PasswordRecoveryController',
          controllerAs: 'vm'
        })
        /*
        -- Password Reset --
        This link will be given by the email you received after giving your email in the previous state
        Here, you can input your new password
        */
        .state('passwordReset', {
          url: '/password_reset/:code',
          authenticate: false,
          templateUrl: 'app/components/passwordReset/passwordReset.html',
          controller: 'PasswordResetController',
          controllerAs: 'vm'
        });

      /* Default state */
      $urlRouterProvider.otherwise('/');

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('!');

      RestangularProvider.setBaseUrl('https://new-api.smartcitizen.me/v0');

      /* Remove angular leaflet logs */
      $logProvider.debugEnabled(false);
    }
})();
