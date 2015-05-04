'use strict';

angular.module('app.components')
  .factory('user', user);
  

  function user(Restangular) {

  	return Restangular.all('users');
  }