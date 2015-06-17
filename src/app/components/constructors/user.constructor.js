(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', function() {

      function User(userData) {
        _.extend(this, userData);

        this.avatar = !this.avatar ? './assets/images/user_details_icon.svg' : this.avatar; 
      }
      return User;      
    });

})();
