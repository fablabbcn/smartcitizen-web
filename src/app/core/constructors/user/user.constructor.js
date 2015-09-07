(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', ['COUNTRY_CODES', function(COUNTRY_CODES) {

      /**
       * User constructor
       * @param {Object} userData - User data sent from API
       * @property {number} id - User ID
       * @property {string} username - Username
       * @property {string} avatar - Avatar URL of user
       * @property {Array} kits - Kits that belongs to this user
       * @property {string} url - URL 
       * @property {string} city - User city
       * @property {string} country - User country
       */
      
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
