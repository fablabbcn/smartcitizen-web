(function() {
  'use strict';

  angular.module('app.components')
    .factory('userUtils', userUtils);

    function userUtils() {
      var service = {
        isAdmin: isAdmin,
        isAuthUser: isAuthUser
      };
      return service;

      ///////////

      function isAdmin(userData) {
        return userData.role === 'admin';
      }
      function isAuthUser(userID, authUserData) {
        return userID === authUserData.id;
      }
    }
})();
