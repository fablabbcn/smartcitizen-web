(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);
    
    auth.$inject = ['$window', 'Restangular'];
    function auth($window, Restangular) {

    	var user = null;
    	initialize();

    	var service = {
        isAuth: isAuth,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        saveToken: saveToken,
        login: login,
        logout: logout
    	};
    	return service;
      
      //////////////////////////

      function initialize() {
        setCurrentUser();
      }

      function setCurrentUser() {
        user = $window.localStorage.getItem('smartcitizen.token');
      }

      function getCurrentUser() {
        return user;
      }

      function isAuth() {
        return !!user;
      }

      function saveToken(token) {
        $window.localStorage.setItem('smartcitizen.token', token);
        setCurrentUser();
      }

      function login(loginData) {
        return Restangular.all('sessions').post(loginData);
      }

      function logout() {

      }
    }
})();
