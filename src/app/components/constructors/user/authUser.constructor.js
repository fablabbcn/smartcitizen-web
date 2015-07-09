(function() {
  'use strict';

  angular.module('app.components')
    .factory('AuthUser', ['User', function(User) {

      function AuthUser(userData) {
        User.call(this, userData);

        this.email = userData.email;
        this.key = '23243532423524234';//userData.key;
        this.macAddress = userData.macAddress; 

        console.log('this', this); 
      }
      AuthUser.prototype = Object.create(User.prototype);
      AuthUser.prototype.constructor = User;

      return AuthUser;
    }]);
})();
