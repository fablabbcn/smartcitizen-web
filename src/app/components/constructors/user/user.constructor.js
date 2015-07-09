(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', ['COUNTRY_CODES', function(COUNTRY_CODES) {

      function User(userData, options) {
        this.username = userData.username;
        this.avatar = userData.avatar;
        this.kits = userData.devices;
        this.url = userData.url;
        this.city = userData.location.city;
        this.country = COUNTRY_CODES[userData.location.country_code];
      }
      return User;      
    }]);

})();
