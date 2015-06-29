(function() { 
	'use strict';

	angular.module('app.components')
	  .factory('user', user);
	  
	  user.$inject = ['$http', 'Restangular', 'auth'];
	  function user($http, Restangular, auth) {
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
        /*return $http({
          method: 'PATCH',
          url: 'https://new-api.smartcitizen.me/v0/me',
          data: updateData,
          headers: {
            'Authorization': 'Bearer ' + auth.getCurrentUser().token 
          }
        });*/
      }

      function removeUser() {
        return Restangular.all('me').remove();
      }
	  }
})();
