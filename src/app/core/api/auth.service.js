(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);

    auth.$inject = ['$location', '$window', '$state', 'Restangular',
      '$rootScope', 'AuthUser', '$timeout', 'alert', '$cookies'];
    function auth($location, $window, $state, Restangular, $rootScope, AuthUser,  $timeout, alert, $cookies) {

    	// var user = {};
      var vm = this;
      vm.user = {};

      //wait until http interceptor is added to Restangular
      $timeout(function() {
    	  initialize();
      }, 100);

    	var service = {
        isAuth: isAuth,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        getCurrentUserFromAPI: getCurrentUserFromAPI,
        recoverPassword: recoverPassword,
        getResetPassword: getResetPassword,
        patchResetPassword: patchResetPassword,
        isAdmin: isAdmin
    	};
    	return service;

      //////////////////////////

      function errorHandler(error) {
      }

      function initialize() {
        // console.log('---- AUTH INIT -----');
        setCurrentUser('appLoad');
      }

      function setCurrentUser(time) {

        return getCurrentUserFromAPI()
          .then(function(data) {

            var newUser = new AuthUser(data);
            //check sensitive information
            if(vm.user.data && vm.user.data.role !== newUser.role) {
              vm.user.data = newUser;
              $location.path('/');
            }
            vm.user.data = newUser;

            $rootScope.$broadcast('loggedIn');

            // used for app initialization
            if(time && time === 'appLoad') {
              //wait until navbar is loaded to emit event
              $timeout(function() {
                $rootScope.$broadcast('loggedIn', {time: 'appLoad'});
              }, 3000);
            } else {
              // used for login
              //$state.reload();
              $timeout(function() {
                alert.success('Login was successful');
                $rootScope.$broadcast('loggedIn', {});
              }, 2000);
            }
          }, errorHandler)
        }

      function getCurrentUser() {
        return vm.user;
      }

      // Should check if user.token exists - but now checks if the cookies.token exists.
      function isAuth() {

        if(vm.user.data === undefined){
          return false
        }

        return !!vm.user.data.key
      }

      function getCurrentUserFromAPI() {
        return Restangular.all('').customGET('me');
      }

      function recoverPassword(data) {
        return Restangular.all('password_resets').post(data);
      }

      function getResetPassword(code) {
        return Restangular.one('password_resets', code).get();
      }
      function patchResetPassword(code, data) {
        return Restangular.one('password_resets', code).patch(data);
      }
      function isAdmin(userData) {
        return userData.role === 'admin';
      }
    }
})();
