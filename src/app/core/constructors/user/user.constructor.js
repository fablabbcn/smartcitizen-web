(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', ['COUNTRY_CODES', function(COUNTRY_CODES) {

      function User(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.avatar = userData.avatar;
        this.kits = userData.devices;
        this.url = userData.url;
        this.city = userData.location.city;
        /*jshint camelcase: false */
        this.country = COUNTRY_CODES[userData.location.country_code];
      }
      return User;      
    }]);

})();
