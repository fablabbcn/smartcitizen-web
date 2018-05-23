    run.$inject = ['$rootScope', '$state', 'Restangular', 'auth', '$templateCache', '$window', 'animation', '$timeout'];
    export default function run($rootScope, $state, Restangular, auth, $templateCache, $window, animation, $timeout) {
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
      $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
        if(toState.name === 'layout.home.kit') {
          /*
            Code to fix Disqus error on state change
            https://help.disqus.com/customer/portal/articles/472107-using-disqus-on-ajax-sites
          */
          // DISQUS.reset({
          //   reload: true,
          //   config: function () {
          //     this.page.identifier = toParams.id;
          //     this.page.url = '/kits/' + toParams.id;
          //     this.page.title = 'Kit number ' + toParams.id;
          //     this.language = 'en';
          //   }
          // });
        }

        if(toState.name === 'layout.home.kit' && fromState.name !== 'layout.home.kit') {
          animation.mapStateLoading();
        }
        if(toState.authenticate === false) {
          if(auth.isAuth()) {
            e.preventDefault();
            $state.go('landing');
            return;
          }
        }

        if(toState.authenticate) {
          if(!auth.isAuth()) {
            e.preventDefault();
            $state.go('landing');
          }
        }

        // move window up on state change
        $window.scrollTo(0, 0);

        return;
      });

      $rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {
        // on state change close all alerts opened
        $timeout(animation.hideAlert, 750);
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
