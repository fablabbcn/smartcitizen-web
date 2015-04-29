'use strict';

angular.module('core.services.auth', [])
  .factory('auth', auth);
  

  function auth($http) {

  	var user = null;
  	initialize();

  	var service = {
      isAuth: isAuth,
      setCurrentUser: setCurrentUser,
      getCurrentUser: getCurrentUser
  	};
  	return service;
    
    //////////////////////////

    function initialize() {
      setCurrentUser();
    }

    function setCurrentUser() {
      user = $window.localStorage.getItem('smartcities.token');
    }

    function getCurrentUser() {
      return user;
    }

    function isAuth() {
      return !!user;
    }
  }