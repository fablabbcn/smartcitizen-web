(function() {
  'use strict';

  angular.module('app.components')
    .factory('AuthUser', ['User', function(User) {

      function AuthUser(userData) {
        User.call(this, userData);

        this.city = userData.city;
        this.country = userData.country;
        this.location = userData.city && userData.country ? userData.city + ', ' + userData.country : null;
        this.email = userData.email;
        this.key = '23243532423524234';//userData.key;
        this.macAddress = userData.macAddress;  
      }
      AuthUser.prototype = Object.create(User.prototype);
      AuthUser.prototype.constructor = User;

      return AuthUser;
    }]);
})();
