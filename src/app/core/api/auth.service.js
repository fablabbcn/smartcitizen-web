(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);

    auth.$inject = ['$location', '$window', '$state', 'Restangular',
      '$rootScope', 'AuthUser', '$timeout', 'alert', '$cookies'];
    function auth($location, $window, $state, Restangular, $rootScope, AuthUser,
       $timeout, alert, $cookies) {

    	var user = {};

      //wait until http interceptor is added to Restangular
      $timeout(function() {
    	  initialize();
      }, 100);

    	var service = {
        isAuth: isAuth,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        updateUser: updateUser,
        saveToken: saveToken,
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
        //console.log('---- auth init -----');
        setCurrentUser('appLoad');
      }
      //run on app initialization so that we can keep auth across different sessions
      function setCurrentUser(time) {
        //user.token = $window.localStorage.getItem('smartcitizen.token') && JSON.parse( $window.localStorage.getItem('smartcitizen.token') );

        if ($cookies.get('smartcitizen.token')) {
          user.token = $cookies.get('smartcitizen.token')
          //console.log('user.token: ', user.token);
        }else{
          //console.log('token not found in cookie, returning');
          return;
        }

        /*
        user.data = $window.localStorage.getItem('smartcitizen.data') &&
          new AuthUser(JSON.parse(
            $window.localStorage.getItem('smartcitizen.data')
          ));
          */

        return getCurrentUserFromAPI()
          .then(function(data) {

            //$window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );

            var newUser = new AuthUser(data);
            //check sensitive information
            if(user.data && user.data.role !== newUser.role) {
              user.data = newUser;
              $location.path('/');
            }
            user.data = newUser;

            //console.log('--- user', user)

            // Broadcast happens 2x, so the user wont think he is not logged in. The other broadcast waits 3sec
            $rootScope.$broadcast('loggedIn');

            // used for app initialization
            if(time && time === 'appLoad') {
              //wait until navbar is loaded to emit event
              $timeout(function() {
                //$rootScope.$broadcast('loggedIn', {time: 'appLoad'});
              }, 3000);
            } else {
              // used for login
              //$state.reload();
              $timeout(function() {
                alert.success('Login was successful');
                $rootScope.$broadcast('loggedIn', {});
              }, 200);
            }
          });
      }

      // Called from device.service.js updateContext(), which is called from multiple /kit/ pages
      function updateUser() {
        return getCurrentUserFromAPI()
          .then(function(data) {
            //$window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
          });
      }

      function getCurrentUser() {
        //console.log('auth.getCurrentUser token', user.token);
        //user.token = $window.localStorage.getItem('smartcitizen.token') && JSON.parse( $window.localStorage.getItem('smartcitizen.token') ),
        //user.data = $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') ));
        return user;
      }

      function isAuth() {
        //return !!$window.localStorage.getItem('smartcitizen.token');
        // TODO: is it better to check if the token exists in a cookie, or if the user.token exists?
        // because the user.token will be empty, not populated, if some services call it before auth initialize() has run
        return !!$cookies.get('smartcitizen.token');
        //return !!user.token;
      }

      // LoginModal calls this after it receives the token.
      function saveToken(token) {
        //console.log('saving Token to cookie:', token);
        //$window.localStorage.setItem('smartcitizen.token', JSON.stringify(token) );
        $cookies.put('smartcitizen.token', token);
        setCurrentUser();
      }

      function login(loginData) {
        return Restangular.all('sessions').post(loginData);
      }

      function logout() {
        //$window.localStorage.removeItem('smartcitizen.token');
        //$window.localStorage.removeItem('smartcitizen.data');
        $cookies.remove('smartcitizen.token');
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
