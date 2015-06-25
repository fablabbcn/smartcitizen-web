(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);
    
    auth.$inject = ['$window', 'Restangular', '$rootScope', 'User'];
    function auth($window, Restangular, $rootScope, User) {

    	var user = {
        token: null,
        data: null
      };

      //wait until http receptor is added to Restangular
      setTimeout(function() {
    	  initialize();
      }, 1000);

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
      //run on app initialization so that we have cross-session auth
      function setCurrentUser() {
        user.token = $window.localStorage.getItem('smartcitizen.token');
        if(!user.token) return;
        getCurrentUserInfo(user.token)
          .then(function(data) {
            user.data = new User(data.plain());
            $rootScope.$broadcast('loggedIn');
          });
      }

      function getCurrentUser() {
        return user;
      }

      function isAuth() {
        return !!user.token;
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

      function getCurrentUserInfo(token) {
        return Restangular.all('').customGET('me');
      }
    }
})();
