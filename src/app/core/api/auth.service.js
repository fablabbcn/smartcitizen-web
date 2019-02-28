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
        //console.log('---- AUTH INIT -----');
        setCurrentUser('appLoad');
      }
      //run on app initialization so that we can keep auth across different sessions
      function setCurrentUser(time) {
        //user.token = $window.localStorage.getItem('smartcitizen.token') && JSON.parse( $window.localStorage.getItem('smartcitizen.token') );

        // TODO later: Should we check if token is expired here?
        if ($cookies.get('smartcitizen.token')) {
          user.token = $cookies.get('smartcitizen.token')
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

            //console.log('-- User populated with data: ', user)

            // Broadcast happens 2x, so the user wont think he is not logged in.
            // The 2nd broadcast waits 3sec, because f.x. on the /kits/ page, the layout has not loaded when the broadcast is sent
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

        // TODO: remove next line. Saving tokenCookie into user.token should only be done in one place. Now this is also done in 'setCurrentUser'
        user.token = $cookies.get('smartcitizen.token');
        return user;
      }

      function isAuth() {
        //return !!$window.localStorage.getItem('smartcitizen.token');
        // TODO: isAuth() is called from many different services BEFORE auth init has run.
        // That means that the user.token is EMPTY, meaning isAuth will be false

        // We can cheat and just check the cookie, but we should NOT. Because auth init should also check if the cookie is valid / expired
        return !!$cookies.get('smartcitizen.token');
        //return !!user.token;
      }

      // LoginModal calls this after it receives the token from the API, and wants to save it in a cookie.
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
