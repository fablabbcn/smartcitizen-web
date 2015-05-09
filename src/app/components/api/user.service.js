'use strict';

angular.module('app.components')
  .factory('user', user);
  
  user.$inject = ['Restangular'];
  function user(Restangular) {

  	return Restangular.all('users');
  }