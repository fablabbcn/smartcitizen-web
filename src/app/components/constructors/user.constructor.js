(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', function() {

      function User(userData, options) {
        if(options && options.type === 'authUser') {
          this.username = userData.username;
          this.avatar = userData.avatar;
          this.kits = userData.devices;
          this.city = userData.city;
          this.country = userData.country;
          this.location = userData.city && userData.country ? userData.city + ', ' + userData.country : null;
          this.url = userData.url;
          this.email = userData.email;
          this.key = userData.key;
          this.macAddress = userData.macAddress;  
        } else {
          this.username = userData.username;
          this.avatar = userData.avatar;
          this.kits = userData.devices;
          this.location = userData.location.city && userData.location.country ? userData.location.city + ', ' + userData.location.country : null;
          this.url = userData.url;          
        }
      }
      return User;      
    });

})();
