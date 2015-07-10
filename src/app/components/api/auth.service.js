(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);
    
    auth.$inject = ['$http', '$window', '$state', 'Restangular', '$rootScope', 'AuthUser'];
    function auth($http, $window, $state, Restangular, $rootScope, AuthUser) {

    	var user = {
        token: null,
        data: null
      };

      var callback, isReloading;

      //wait until http interceptor is added to Restangular
      setTimeout(function() {
    	  initialize();
      }, 0);

    	var service = {
        isAuth: isAuth,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        saveToken: saveToken,
        login: login,
        logout: logout,
        recoverPassword: recoverPassword,
        getResetPassword: getResetPassword,
        patchResetPassword: patchResetPassword,
        registerCallback: registerCallback,
        setReloading: setReloading,
        reloading: reloading
    	};
    	return service;
      
      //////////////////////////

      function initialize() {
        setCurrentUser();
      }
      //run on app initialization so that we have cross-session auth
      function setCurrentUser() {
        user.token = $window.localStorage.getItem('smartcitizen.token');
        if(!user.token) return;
        getCurrentUserInfo()
          .then(function(data) {
            user.data = new AuthUser(data);
            $rootScope.$broadcast('loggedIn');
            if(callback) {
              callback();
              callback = undefined;
            }

            setReloading(true);
            try {
              $state.reload();              
            } catch(err) {
              //setup listener to reload on controller init
              setTimeout(function() {
                $state.reload();                
              }, 3000);
            }
            setReloading(false);
          });
      }

      function getCurrentUser() {
        return user;
      }

      function isAuth() {
        return !!$window.localStorage.getItem('smartcitizen.token');
      }
      //save to localstorage and 
      function saveToken(token) {
        $window.localStorage.setItem('smartcitizen.token', token);
        setCurrentUser();
      }

      function login(loginData) {
        return Restangular.all('sessions').post(loginData);
      }

      function logout() {
        $window.localStorage.removeItem('smartcitizen.token');
      }

      function getCurrentUserInfo() {
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

      function registerCallback(cb) {
        if(callback) return;
        callback = cb;
      }

      function setReloading(boolean) {
        isReloading = boolean;
      }

      function reloading() {
        return isReloading;
      }
    }
})();
