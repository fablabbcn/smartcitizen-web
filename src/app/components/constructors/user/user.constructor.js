(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', function() {

      function User(userData, options) {
        this.username = userData.username;
        this.avatar = userData.avatar;
        this.kits = userData.devices;
        this.url = userData.url;          
      }
      return User;      
    });

})();
