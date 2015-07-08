(function() {
  'use strict';

  angular.module('app.components')
    .factory('NonAuthUser', ['User', function(User) {

      function NonAuthUser(userData) {
        User.call(this, userData);

        this.location = userData.location.city && userData.location.country ? userData.location.city + ', ' + userData.location.country : null;  
      }
      NonAuthUser.prototype = Object.create(User.prototype);
      NonAuthUser.prototype.constructor = User;

      return NonAuthUser;
    }]);
})();
