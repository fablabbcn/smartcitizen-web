(function() {
  'use strict';

  angular.module('app')
    .config(config);

  /*
    Check app.config.js to know how states are protected
  */

  config.$inject = ['$stateProvider', '$urlRouterProvider',
    '$locationProvider', 'RestangularProvider', '$logProvider',
    '$httpProvider'
  ];

  function config($stateProvider, $urlRouterProvider, $locationProvider,
    RestangularProvider, $logProvider, $httpProvider) {

    $httpProvider.interceptors.push('cacheDevInterceptor');

    $stateProvider
    /*
     -- Landing state --
     Grabs your location and redirects you to the closest marker with data
    */
      .state('landing', {
        url: '/',
        controller: function($state) {
          $state.go('layout.home.kit');
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
      .state('layout.styleguide', {
        url: '/styleguide',
        templateUrl: 'app/components/static/styleguide.html',
        controller: 'StaticController',
        controllerAs: 'vm',
      })
      /*
      -- Static page template --
      Template for creating other static pages.
      */
      // .state('layout.static', {
      //   url: '/static',
      //   templateUrl: 'app/components/static/static.html',
      //   controller: 'StaticController',
      //   controllerAs: 'vm'
      // })
      .state('layout.policy', {
        url: '/policy',
        templateUrl: 'app/components/static/policy.html',
        controller: 'StaticController',
        controllerAs: 'vm'
      })
      .state('layout.about', {
        url: '/about',
        templateUrl: 'app/components/static/about.html',
        controller: 'StaticController',
        controllerAs: 'vm'
      })

    .state('layout.kitEdit', {
      url: '/kits/edit/:id?step',
      templateUrl: 'app/components/kit/editKit/editKit.html',
      controller: 'EditKitController',
      controllerAs: 'vm',
      resolve: {
        belongsToUser: function(auth, $location, $stateParams, userUtils,
          kitUtils, $window, AuthUser) {
          if (!auth.isAuth()) {
            $location.path('/');
            return;
          }
          var kitID = parseInt($stateParams.id);
          var userData = (auth.getCurrentUser().data) || ($window.localStorage
            .getItem('smartcitizen.data') && new AuthUser(JSON.parse(
              $window.localStorage.getItem('smartcitizen.data'))));
          var belongsToUser = kitUtils.belongsToUser(userData.kits,
            kitID);
          var isAdmin = userUtils.isAdmin(userData);

          if (!isAdmin && !belongsToUser) {
            console.error('This kit does not belong to user');
            $location.path('/');
          }
        },
        step: function($stateParams) {
          return parseInt($stateParams.step) || 1;
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
          sensorTypes: function(sensor) {
            return sensor.callAPI()
              .then(function(sensorTypes) {
                return sensorTypes.plain();
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
          belongsToUser: function($window, $stateParams, auth, AuthUser,
            kitUtils, userUtils) {
            if (!auth.isAuth() || !$stateParams.id) {
              return false;
            }
            var kitID = parseInt($stateParams.id);
            var userData = (auth.getCurrentUser().data) || ($window.localStorage
              .getItem('smartcitizen.data') && new AuthUser(JSON.parse(
                $window.localStorage.getItem('smartcitizen.data'))));
            var belongsToUser = kitUtils.belongsToUser(userData.kits,
              kitID);
            var isAdmin = userUtils.isAdmin(userData);

            return isAdmin || belongsToUser;
          }
        }
      })
      /*
      -- User Profile state --
      Nested inside layout state
      Public profile of a given user
      Redirects to My Profile/My Profile Admin if the user is the one 
      authenticated or if the authenticated user is an admin
      */
      .state('layout.userProfile', {
        url: '/users/:id',
        templateUrl: 'app/components/userProfile/userProfile.html',
        controller: 'UserProfileController',
        controllerAs: 'vm',
        resolve: {
          isCurrentUser: function($stateParams, $location, auth) {
            if (!auth.isAuth()) {
              return;
            }
            var userID = parseInt($stateParams.id);
            var authUserID = auth.getCurrentUser().data && auth.getCurrentUser()
              .data.id;
            if (userID === authUserID) {
              $location.path('/profile');
            }
          },
          isAdmin: function($window, $location, $stateParams, auth,
            AuthUser) {
            var userRole = (auth.getCurrentUser().data && auth.getCurrentUser()
              .data.role) || ($window.localStorage.getItem(
              'smartcitizen.data') && new AuthUser(JSON.parse($window
              .localStorage.getItem('smartcitizen.data'))).role);
            if (userRole === 'admin') {
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
            var userData = (auth.getCurrentUser().data) || ($window.localStorage
              .getItem('smartcitizen.data') && new AuthUser(JSON.parse(
                $window.localStorage.getItem('smartcitizen.data'))));
            if (!userData) {
              return;
            }
            return userData;
          }
        }
      })
      .state('layout.myProfile.kits', {
        url: '/kits',
        authenticate: true,
        templateUrl: 'app/components/myProfile/Kits.html',
        controllerAs: 'vm',
      })
      .state('layout.myProfile.user', {
        url: '/users',
        authenticate: true,
        templateUrl: 'app/components/myProfile/Users.html',
        controllerAs: 'vm',
      })
      .state('layout.myProfile.tools', {
        url: '/tools',
        authenticate: true,
        templateUrl: 'app/components/myProfile/Tools.html',
        controllerAs: 'vm',
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
            var userRole = (auth.getCurrentUser().data && auth.getCurrentUser()
              .data.role) || ($window.localStorage.getItem(
              'smartcitizen.data') && new AuthUser(JSON.parse($window
              .localStorage.getItem('smartcitizen.data'))).role);
            if (userRole !== 'admin') {
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
          }
        }
      })
      /*
      -- Login --
      It redirects to a certain kit state and opens the login dialog 
      automatically
      */
      .state('layout.login', {
        url: '/login',
        authenticate: false,
        resolve: {
          buttonToClick: function($location, auth) {
            if (auth.isAuth()) {
              return $location.path('/');
            }
            $location.path('/kits/667');
            $location.search('login', 'true');
          }
        }
      })
      /*
      -- Signup --
      It redirects to a certain kit state and opens the signup dialog 
      automatically
      */
      .state('layout.signup', {
        url: '/signup',
        authenticate: false,
        resolve: {
          buttonToClick: function($location, auth) {
            if (auth.isAuth()) {
              return $location.path('/');
            }
            $location.path('/kits/667');
            $location.search('signup', 'true');
          }
        }
      })
      /*
      -- Logout --
      It removes all the user data from localstorage and redirects 
      to landing state
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
      Form to input your email address to receive an email to reset
       your password
      */
      .state('passwordRecovery', {
        url: '/password_reset',
        authenticate: false,
        templateUrl: 'app/components/passwordRecovery/passwordRecovery.html',
        controller: 'PasswordRecoveryController',
        controllerAs: 'vm'
      })
      /*
      -- Password Reset --
      This link will be given by the email you received after giving your 
      email in the previous state
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

  angular.module('app')
    .factory('cacheDevInterceptor', cacheDevInterceptor);

  cacheDevInterceptor.$inject = ['$cacheFactory'];

  function cacheDevInterceptor($cacheFactory) {

    var cache = $cacheFactory('cacheDev');

    return {
      // optional method

      // optional method
      'response': function(response) {

        if (response.config.method === 'PATCH' && response.status === 200) {
          if (cache.get(response.config.url)) {
            cache.remove(response.config.url);
          }
          cache.put(response.config.url, {
            data: response.data,
            timestamp: moment()
          });
        }

        if (response.config.method === 'GET' && response.status === 200) {
          if (cache.get(response.config.url)) {
            var now = moment();
            var cachedObj = cache.get(response.config.url);
            if (now.diff(cachedObj.timestamp, 'seconds') < 30) {
              response.data = cachedObj.data;
            }
          }
        }

        return response;
      },

    };
  }

})();