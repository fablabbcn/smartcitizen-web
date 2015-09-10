(function() {
  'use strict';

  angular.module('app.components')
    .factory('AuthUser', ['User', function(User) {

      /**
       * AuthUser constructor. Used for authenticated users
       * @extends User
       * @param {Object} userData - Contains user data sent from API
       * @property {string} email - User email
       * @property {string} role - User role. Ex: admin
       * @property {string} key - Personal API Key 
       */
      
      function AuthUser(userData) {
        User.call(this, userData);

        this.email = userData.email;
        this.role = userData.role;
        /*jshint camelcase: false */
        this.key = userData.legacy_api_key;
      }
      AuthUser.prototype = Object.create(User.prototype);
      AuthUser.prototype.constructor = User;

      return AuthUser;
    }]);
})();
