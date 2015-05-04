'use strict';

angular.module('components.api')
  .factory('user', user);
  

  function user(Restangular) {

  	return Restangular.all('users');
  }