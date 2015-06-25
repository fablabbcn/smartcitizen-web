(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', function() {

      function User(userData) {
        this.username = userData.username;
        this.avatar = userData.avatar || './assets/images/user_details_icon.svg';
        this.kits = userData.devices;
        this.location = userData.location.city && userData.location.country ? userData.location.city + ', ' + userData.location.country : 'Barcelona, Spain';
        this.url = userData.url || 'http://example.com';
      }
      return User;      
    });

})();
