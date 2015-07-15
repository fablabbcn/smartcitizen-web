(function() {
  'use strict';

  angular.module('app.components')
    .factory('searchUtils', searchUtils);


    searchUtils.$inject = [];
    function searchUtils() {
      var service = {
        parseLocation: parseLocation,
        parseName: parseName
      };
      return service;

      /////////////////

      function parseLocation(object) {
        var location = '';

        if(!!object.city) {
          location += object.city;
        }
        if(!!object.country) {
          location += ', ' + object.country;
        }

        return location;
      }

      function parseName(object) {
        var name = object.type === 'User' ? object.username : object.name;
        return !name ? 'No name' : name; 
      }
    }
})();
