'use strict';

angular.module('app.core')
  .factory('animation', animation);
  

  function animation($rootScope) {

  	var service = {
      blur: blur,
      unblur: unblur
  	};
  	return service;


  	function blur() {
      $rootScope.$broadcast('blur');
  	}

  	function unblur() {
  	  $rootScope.$broadcast('unblur');
  	}
  }
