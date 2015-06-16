(function() {
  'use strict';

  angular.module('app')
    .run(run);
    
    run.$inject = ['$rootScope', 'Restangular', 'auth'];
    function run($rootScope, Restangular, auth) {
      /**
     * every time the state changes, run this check for whether the state
     * requires authentication and, if needed, whether the user is
     * authenticated.
     */
      $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {

      });

      Restangular.addFullRequestInterceptor(function (element, operation, what, url, headers, params, httpConfig) {
        if (auth.isAuth()) {
          var token = auth.getCurrentUser();
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
