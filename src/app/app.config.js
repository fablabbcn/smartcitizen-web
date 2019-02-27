(function() {
  'use strict';

  angular.module('app')
    .run(run);

    run.$inject = ['$rootScope', '$state', 'Restangular', 'auth', '$templateCache', '$window', 'animation', '$timeout', '$transitions'];
    function run($rootScope, $state, Restangular, auth, $templateCache, $window, animation, $timeout, $transitions) {
      /**
       * every time the state changes, run this check for whether the state
       * requires authentication and, if needed, whether the user is
       * authenticated.
       *
       * authenticate can be: true, false or undefined
       * true when the user must be authenticated to access the route. ex: user profile
       * false when the user cannot be authenticated to access the route. ex: login, signup
       * undefined when it doesn't matter whether the user is logged in or not
       */

      /*jshint unused:false*/

      $transitions.onStart({}, function(trans) {

        if(trans.to().name === 'layout.home.kit' && trans.from().name !== 'layout.home.kit') {
          animation.mapStateLoading();
        }

        if(trans.to().authenticate === false) {
          if(auth.isAuth()) {
            // TODO: does not redirect because e is undefined
            e.preventDefault();
            $state.go('landing');
            return;
          }
        }

        if(trans.to().authenticate) {
          if(!auth.isAuth()) {
            $state.go('layout.login');
          }
        }

        // move window up on state change
        $window.scrollTo(0, 0);

        return;
      });

      $transitions.onCreate({}, function(trans) {
        animation.mapStateLoaded();
        animation.hideAlert();
      });

      Restangular.addFullRequestInterceptor(function (element, operation, what, url, headers, params, httpConfig) {
        if (auth.isAuth()) {
          var token = auth.getCurrentUser().token;
          headers.Authorization = 'Bearer ' + token;
        }
        return {
          element: element,
          headers: headers,
          params: params,
          httpConfig: httpConfig
        };
      });
    }

})();
