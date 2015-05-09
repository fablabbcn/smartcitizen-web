'use strict';

angular.module('app.components')
  .factory('animation', animation);
  
  animation.$inject = ['$rootScope'];
  function animation($rootScope) {

  	var service = {
      blur: blur,
      unblur: unblur,
      removeNav: removeNav,
      addNav: addNav
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
  }
