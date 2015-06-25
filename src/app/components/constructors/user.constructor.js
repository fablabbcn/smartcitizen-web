(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', function() {

      function User(userData, options) {
        if(options && options.type === 'authUser') {
          this.username = userData.username;
          this.avatar = userData.avatar || './assets/images/user_details_icon.svg';
          this.kits = userData.devices;
          this.city = userData.location.city || 'No city';
          this.country = userData.location.country || 'No country';
          this.location = userData.location.city && userData.location.country ? userData.location.city + ', ' + userData.location.country : 'Barcelona, Spain';
          this.url = userData.url || 'http://example.com';
          this.email = userData.email || 'no email';
          this.key = '';
          this.macAddress = '';  
        } else {
          this.username = userData.username;
          this.avatar = userData.avatar || './assets/images/user_details_icon.svg';
          this.kits = userData.devices;
          this.location = userData.location.city && userData.location.country ? userData.location.city + ', ' + userData.location.country : 'Barcelona, Spain';
          this.url = userData.url || 'http://example.com';          
        }
      }
      return User;      
    });

})();
