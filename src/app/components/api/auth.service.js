'use strict';

angular.module('components.api')
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
      user = $window.localStorage.getItem('smartcitizen.token');
    }

    function getCurrentUser() {
      return user;
    }

    function isAuth() {
      return !!user;
    }
  }