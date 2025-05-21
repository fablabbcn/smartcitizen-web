(function() {
  'use strict';

  angular.module('app')
    .config(config);

    /*
      Check app.config.js to know how states are protected
    */

    config.$inject = ['$stateProvider', '$urlServiceProvider', '$locationProvider', 'RestangularProvider', '$logProvider', '$mdAriaProvider', '$cookiesProvider'];
    function config($stateProvider, $urlServiceProvider, $locationProvider, RestangularProvider, $logProvider, $mdAriaProvider, $cookiesProvider) {
      $stateProvider
        /*
         -- Landing state --
         Grabs your location and redirects you to the closest marker with data
        */
        .state('landing', {
          url: '/',
          templateUrl: 'app/components/landing/landing.html',
          controller: 'LandingController',
          controllerAs: 'vm'
        })
        /*
        -- Layout state --
        Top-level state used for inserting the layout(navbar and footer)
        */
        .state('embbed', {
          url: '/embbed?tags&lat&lng&zoom',
          templateUrl: 'app/components/map/mapEmbbed.html',
          controller: 'MapController',
          controllerAs: 'vm',
          resolve: {
            selectedTags: function($stateParams, tag){
              if(typeof($stateParams.tags) === 'string'){
                tag.setSelectedTags([$stateParams.tags]);
              } else{
                // We have an array
                tag.setSelectedTags(_.uniq($stateParams.tags));
              }
            }
          }
        })
        .state('layout', {
          url: '',
          abstract: true,
          templateUrl: 'app/components/layout/layout.html',
          controller: 'LayoutController',
          controllerAs: 'vm',
          resolve:{
            isLogged: function(auth){
              auth.setCurrentUser();
            }
          }
        })
        .state('layout.styleguide',{
          url: '/styleguide',
          templateUrl: 'app/components/static/styleguide.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        /*
        -- Static page template --
        Template for creating other static pages.
        */
        .state('layout.policy', {
          url: '/policy',
          templateUrl: 'app/components/static/policy.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        // TODO redirect
        .state('layout.about', {
          url: '/about',
          templateUrl: 'app/components/static/about.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        /*
         -- 404 state --
         Standard error page
        */
        .state('layout.404', {
          url: '/404',
          templateUrl: 'app/components/static/404.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        .state('layout.kitEdit', {
          url: '/kits/:id/edit?step',
          templateUrl: 'app/components/interstitial/interstitial.html',
          controller: 'EditKitController',
          controllerAs: 'vm',
        })
        .state('layout.kitUpload', {
          url: '/kits/:id/upload',
          templateUrl: 'app/components/interstitial/interstitial.html',
          controller: 'UploadController',
          controllerAs: 'vm',
        })

        /*
        -- Home state --
        Nested inside the layout state
        It contains the map and all the data related to it
        Abstract state, it only activates when there's a child state activated
        */
        .state('layout.home', {
          url: '/kits?tags',
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
            selectedTags: function($stateParams, tag){
              if(typeof($stateParams.tags) === 'string'){
                tag.setSelectedTags([$stateParams.tags]);
              }else{
                // We have an array
                tag.setSelectedTags(_.uniq($stateParams.tags));
              }
            }
          }
        })
        .state('layout.home.tags', {
          url: '/tags',
          views: {
            'container@layout.home': {
              templateUrl: 'app/components/tags/tags.html',
              controller: 'tagsController',
              controllerAs: 'tagsCtl'
            }
          },
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
          params: {id: '', reloadMap: false},
        })
        /*
        -- User Profile state --
        Nested inside layout state
        Public profile of a given user
        Redirects to My Profile/My Profile Admin if the user is the one authenticated or if the authenticated user is an admin
        */
        .state('layout.userProfile', {
          url: '/users/:id',
          templateUrl: 'app/components/interstitial/interstitial.html',
          controller: 'UserProfileController',
          controllerAs: 'vm',
          resolve: {
            isCurrentUser: function($stateParams, $location, auth) {
              // console.log('iscurrentuser')
              if(!auth.isAuth()) {
                return;
              }
              var userID = parseInt($stateParams.id);
              var authUserID = auth.getCurrentUser().data && auth.getCurrentUser().data.id;
              if(userID === authUserID) {
                $location.path('/profile');
              }
            },
            isAdmin: function($window, $location, $stateParams, auth, AuthUser) {
              var userRole = (auth.getCurrentUser().data && auth.getCurrentUser().data.role) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )).role);
              // console.log('isAdmin')
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
          abstract: true,
          templateUrl: 'app/components/interstitial/interstitial.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            userData: function(auth) {
              var userData = auth.getCurrentUserFromAPI()
              .then(function(data){
                  return data;
              })
              return userData;
            }
          }
        // TODO
        // I have tried to work on doing a redirect from the resolver, but I think this is not a good practice
        // I delegate the work on the controller instead, with the interstitial template
        })
        .state('layout.myProfile.kits', {
          url: '/kits',
          cache: false,
          authenticate: true,
          templateUrl: 'app/components/interstitial/interstitial.html',
          controllerAs: 'vm',
          resolve: {
            userData: function(auth) {
              var userData = auth.getCurrentUserFromAPI()
              .then(function(data){
                  return data;
              })
              return userData;
            }
          }
        })
        .state('layout.myProfile.user', {
          url: '/users',
          authenticate: true,
          templateUrl: 'app/components/interstitial/interstitial.html',
          controllerAs: 'vm',
        })
        /*
        -- My Profile Admin --
        State to let admins see private profiles of users with full data
        */
        .state('layout.myProfileAdmin', {
          url: '/profile/:id',
          authenticate: true,
          abstract: true,
          templateUrl: 'app/components/interstitial/interstitial.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            isAdmin: function($window, auth, $location, AuthUser) {
              var userRole = (auth.getCurrentUser().data && auth.getCurrentUser().data.role) || ( $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )).role );
              if(userRole !== 'admin') {
                $location.path('/kits/');
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
        .state('layout.myProfileAdmin.kits', {
          url: '/kits',
          cache: false,
          authenticate: true,
          templateUrl: 'app/components/interstitial/interstitial.html',
          controllerAs: 'vm',
        })
        .state('layout.myProfileAdmin.user', {
          url: '/users',
          authenticate: true,
          templateUrl: 'app/components/interstitial/interstitial.html',
          controllerAs: 'vm',
        })

      /*  Disable missing aria-label warnings in console */
      $mdAriaProvider.disableWarnings();

      /* Default state */
      $urlServiceProvider.rules.otherwise('/kits');

      /* Default state */
      $urlServiceProvider.rules.when('/kits', '/kits/');

      /* Default profile state */
      $urlServiceProvider.rules.when('/profile', '/profile/kits');
      $urlServiceProvider.rules.when('/profile/:id', '/profile/:id/kits');

      /* Default profile state */
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('!');

      /*  Sets the default Smart Citizen API base url */
      RestangularProvider.setBaseUrl('https://api.smartcitizen.me/v0');
      // RestangularProvider.setBaseUrl('https://staging-api.smartcitizen.me/v0')
      RestangularProvider.setDefaultHttpFields({withCredentials: true});
      //RestangularProvider.setBaseUrl('http://localhost:3000/v0');

      /* Remove angular leaflet logs */
      $logProvider.debugEnabled(false);

      /* Allow cookies across *.smartcitizen.me Apps */
      $cookiesProvider.defaults.path = '/';
      $cookiesProvider.defaults.domain = '.smartcitizen.me';

    }
})();
