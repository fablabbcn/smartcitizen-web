import angular from 'angular';

  angular.module('app.components')
    .factory('NonAuthUser', ['User', function(User) {

      function NonAuthUser(userData) {
        User.call(this, userData);
      }
      NonAuthUser.prototype = Object.create(User.prototype);
      NonAuthUser.prototype.constructor = User;

      return NonAuthUser;
    }]);

