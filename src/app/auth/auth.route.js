/*(function() {
  'use strict';

  angular.module('app.auth')
    .config(config);

  config.$inject = ['$stateProvider'];
  function config($stateProvider) {
    $stateProvider
      .state('logout', {
        url: '/logout',
        resolve: {
          logout: function($state, auth) {
            auth.logout();
            $state.go('home');
          }
        }
      })
  }
})();
*/
