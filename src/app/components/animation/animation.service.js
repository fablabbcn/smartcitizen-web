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
        showChartSpinner: showChartSpinner,
        hideChartSpinner: hideChartSpinner,
        kitLoaded: kitLoaded,
        showPasswordRecovery: showPasswordRecovery,
        showLogin: showLogin,
        showSignup: showSignup,
        showPasswordReset: showPasswordReset
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
      function showChartSpinner() {
        $rootScope.$broadcast('showChartSpinner');
      }
      function hideChartSpinner() {
        $rootScope.$broadcast('hideChartSpinner');
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
      function showPasswordReset() {
        $rootScope.$broadcast('showPasswordReset');
      }
    }
})();
