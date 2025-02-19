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
        // updateUser: updateUser,
        // saveToken: saveToken,
        // getToken: getToken,
        // login: login,
        // logout: logout,
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

      // Not applicable anymore
      //run on app initialization so that we can keep auth across different sessions
      // 1. Check if token in cookie exists. Return if it doesn't, user needs to login (and save a token to the cookie)
      // 2. Populate user.data with the response from the API.
      // 3. Broadcast logged in

      function setCurrentUser(time) {
        // TODO later: Should we check if token is expired here?
        // if (getToken()) {
        //   vm.user.token = getToken();
        // }else{
        //   //console.log('token not found in cookie, returning');
        //   return;
        // }

        // console.log('---- SET CURRENT USER -----');

        return getCurrentUserFromAPI()
          .then(function(data) {
            // Save user.data also in localStorage. It is beeing used across the app.
            // Should it instead just be saved in the user object? Or is it OK to also have it in localStorage?
            // $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
            // console.log('data')
            // console.log(data);
            var newUser = new AuthUser(data);
            //check sensitive information
            if(vm.user.data && vm.user.data.role !== newUser.role) {
              vm.user.data = newUser;
              $location.path('/');
            }
            vm.user.data = newUser;

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
              }, 2000);
            }
          }, errorHandler)
        }

      // Called from device.service.js updateContext(), which is called from multiple /kit/ pages
      // function updateUser() {
      //   console.log('update user')
      //   return getCurrentUserFromAPI()
      //     .then(function(data) {
      //       // TODO: Should this update the token or user.data? Then it could instead call setCurrentUser?
      //       $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
      //       return getCurrentUser();
      //     });
      // }

      function getCurrentUser() {
        // console.log('vm.user')
        // console.log(vm.user);
        // user.token = getToken();
        // user.data = $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') ));
        return vm.user;
      }

      // Should check if user.token exists - but now checks if the cookies.token exists.
      function isAuth() {
        // TODO: isAuth() is called from many different services BEFORE auth.init has run.
        // That means that the user.token is EMPTY, meaning isAuth will be false
        // We can cheat and just check the cookie, but we should NOT. Because auth.init should also check if the cookie is valid / expired
        // Ideally it should return !!user.token
        //return !!user.token;
        // return !!getToken();
        // updateUser();

        if(vm.user.data === undefined){
          return false
        }

        // console.log('user')
        // console.log(vm.user);
        // console.log(vm.user.data.key);
        // console.log(!!vm.user.data.key)
        return !!vm.user.data.key
      }

      // LoginModal calls this after it receives the token from the API, and wants to save it in a cookie.
      // function saveToken(token) {
      //   //console.log('saving Token to cookie:', token);
      //   $cookies.put('smartcitizen.token', token);
      //   setCurrentUser();
      // }

      // function getToken(){
      //   return $cookies.get('smartcitizen.token');
      // }

      // function login(loginData) {
      //   return Restangular.all('sessions').post(loginData);
      // }

      // function logout() {
      //   $cookies.remove('smartcitizen.token');
      // }

      function getCurrentUserFromAPI() {
        // console.log('getting user')
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
