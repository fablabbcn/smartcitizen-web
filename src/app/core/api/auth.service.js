(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);
    
    auth.$inject = ['$location', '$window', '$state', 'Restangular', '$rootScope', 'AuthUser', '$timeout', 'alert'];
    function auth($location, $window, $state, Restangular, $rootScope, AuthUser, $timeout, alert) {

    	var user = {
        token: null,
        data: null
      };

      //wait until http interceptor is added to Restangular
      $timeout(function() {
    	  initialize();
      }, 1000);

    	var service = {
        isAuth: isAuth,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        updateUser: updateUser,
        saveData: saveData,
        login: login,
        logout: logout,
        recoverPassword: recoverPassword,
        getResetPassword: getResetPassword,
        patchResetPassword: patchResetPassword,
        isAdmin: isAdmin
    	};
    	return service;
      
      //////////////////////////

      function initialize() {
        setCurrentUser('appLoad');
      }
      //run on app initialization so that we can keep auth across different sessions
      function setCurrentUser(time) {
        user.token = $window.localStorage.getItem('smartcitizen.token') && JSON.parse( $window.localStorage.getItem('smartcitizen.token') );
        user.data = $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') ));
        if(!user.token) {
          return;
        }
        getCurrentUserInfo()
          .then(function(data) {
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
            
            var newUser = new AuthUser(data);
            //check sensitive information
            if(user.data && user.data.role !== newUser.role) {
              user.data = newUser;
              $location.path('/');
            }
            user.data = newUser;

            if(time && time === 'appLoad') {
              //wait until navbar is loaded to emit event
              $timeout(function() {
                $rootScope.$broadcast('loggedIn', {time: 'appLoad'});
              }, 2000);              
            } else {
              $state.reload();
              setTimeout(function() {
                alert.success('Signup was successful');
                $rootScope.$broadcast('loggedIn', {});                
              }, 2000);
            }
          });
      }

      function updateUser(delay) {
        getCurrentUserInfo()
          .then(function(data) {
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
          });
      }

      function getCurrentUser() {
        return user;
      }

      function isAuth() {
        return !!$window.localStorage.getItem('smartcitizen.token');
      }
      //save to localstorage and 
      function saveData(token) {
        $window.localStorage.setItem('smartcitizen.token', JSON.stringify(token) );
        setCurrentUser();
      }

      function login(loginData) {
        return Restangular.all('sessions').post(loginData);
      }

      function logout() {
        $window.localStorage.removeItem('smartcitizen.token');
        $window.localStorage.removeItem('smartcitizen.data');
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
      function isAdmin(userData) {
        return userData.role === 'admin';
      }
    }
})();
