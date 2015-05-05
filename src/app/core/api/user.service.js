'use strict';

angular.module('core.services.user', [])
  .factory('user', user);
  

  function user(Restangular) {

  	return Restangular.all('users');
  }