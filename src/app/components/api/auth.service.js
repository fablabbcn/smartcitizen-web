(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);
    
    auth.$inject = ['$location', '$window', '$state', 'Restangular', '$rootScope', 'AuthUser'];
    function auth($location, $window, $state, Restangular, $rootScope, AuthUser) {

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
        saveData: saveData,
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
        setCurrentUser('appLoad');
      }
      //run on app initialization so that we have cross-session auth
      function setCurrentUser(time) {
        user.token = JSON.parse( $window.localStorage.getItem('smartcitizen.token') );
        user.data = $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') ));
        if(!user.token) return;
        getCurrentUserInfo()
          .then(function(data) {
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
            
            var newUser = new AuthUser(data);;
            //check sensitive information
            if(user.data && user.data.role !== newUser.role) {
              user.data = newUser;
              $location.path('/');
            }
            user.data = newUser;

            $rootScope.$broadcast('loggedIn');



            /*if(callback) {
              callback();
              callback = undefined;
            }*/

/*            if(time === 'appLoad') {
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
            }*/
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
