(function() { 
	'use strict';

	angular.module('app.components')
	  .factory('user', user);
	  
	  user.$inject = ['Restangular'];
	  function user(Restangular) {
      var service = {
        createUser: createUser,
        getUser: getUser,
        updateUser: updateUser,
        removeUser: removeUser
      };
      return service;

      ////////////////////

      function createUser(signupData) {
        return Restangular.all('users').post(signupData);
      }

      function getUser(id) {
        return Restangular.one('users', id).get();
      }

      function updateUser(updateData) {
        return Restangular.all('me').customPUT(updateData);
      }

      function removeUser() {
        return Restangular.all('me').remove();
      }
	  }
})();
