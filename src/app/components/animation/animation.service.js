(function() {
  'use strict';

  angular.module('app.components')
    .factory('animation', animation);
    
    animation.$inject = ['$rootScope'];
    function animation($rootScope) {

    	var service = {
        blur: blur,
        unblur: unblur,
        removeNav: removeNav,
        addNav: addNav,
        showSpinner: showSpinner,
        hideSpinner: hideSpinner,
        kitLoaded: kitLoaded,
        showPasswordRecovery: showPasswordRecovery,
        showLogin: showLogin,
        showSignup: showSignup
    	};
    	return service;

      //////////////
      
    	function blur() {
        $rootScope.$broadcast('blur');
    	}

    	function unblur() {
    	  $rootScope.$broadcast('unblur');
    	}

      function removeNav() {
        $rootScope.$broadcast('removeNav');
      }

      function addNav() {
        $rootScope.$broadcast('addNav');
      }

      function showSpinner() {
        $rootScope.$broadcast('showSpinner');
      }

      function hideSpinner() {
        $rootScope.$broadcast('hideSpinner');
      }

      function kitLoaded(data) {
        $rootScope.$broadcast('kitLoaded', data);
      }

      function showPasswordRecovery() {
        $rootScope.$broadcast('showPasswordRecovery');
      }

      function showLogin() {
        $rootScope.$broadcast('showLogin');
      }

      function showSignup() {
        $rootScope.$broadcast('showSignup');
      }
    }
})();
