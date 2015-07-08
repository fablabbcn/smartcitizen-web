(function() {
  'use strict';

  angular.module('app')
    .run(run);
    
    run.$inject = ['$rootScope', '$state', 'Restangular', 'auth', '$templateCache'];
    function run($rootScope, $state, Restangular, auth, $templateCache) {
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
      $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
        
        if(toState.authenticate) {
          if(!auth.isAuth()) {
            e.preventDefault();
            $state.go('landing');
          }
        }

        if(toState.authenticate === false) {
          if(auth.isAuth()) {
            e.preventDefault()
            $state.go('landing');
          } 
        }
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

      /*$templateCache.put('ngDropdowns/templates/dropdownMenu.html', [
        '<div class="wrap-dd-select my-custom-class">',
          '<span class="selected my-selected-class">{{dropdownModel[labelField]}}</span>',
          '<ul class="custom-dropdown">',
            '<li ng-repeat="item in dropdownSelect"',
            ' class="dropdown-item"',
            ' dropdown-select-item="item"',
            ' dropdown-item-label="labelField">',
            '</li>',
          '</ul>',
        '</div>'
      ].join(''));
      */
    }

})();
