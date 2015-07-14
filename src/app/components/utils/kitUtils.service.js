(function() {
  'use strict';

  angular.module('app.components')
    .factory('kitUtils', kitUtils);

    kitUtils.$inject = ['COUNTRY_CODES'];
    function kitUtils(COUNTRY_CODES) {
      var service = {
        parseLocation: parseLocation,
        parseLabels: parseLabels,
        parseType: parseType,
        classify: classify,
        parseTime: parseTime,
        parseVersion: parseVersion,
        parseOwner: parseOwner,
        parseState: parseState,
        parseAvatar: parseAvatar,
        belongsToUser: belongsToUser
      };

      return service;


      ///////////////

      function parseLocation(object) {
        var location = '';
        
        var city = object.data.location.city;
        var country = object.data.location.country;

        if(!!city) {
          location += city;
        }
        if(!!country) {
          location += ', ' + country;
        }

        return location;
      }

      function parseLabels(object) {
        var status = object.device.status === 'new' ? 'offline' : object.device.status;
        var exposure = object.data.location.exposure;
        return {
          status: status,
          exposure: exposure
        };
      }

      function parseType(object) {
        var kitType; 

        if((new RegExp('sck', 'i')).test(object.kit.name)) { 
          kitType = 'SmartCitizen Kit';
        }
        return kitType; 
      }

      function classify(kitType) {
        if(!kitType) {
          return '';
        }
        return kitType.toLowerCase().split(' ').join('_');
      }

      function parseTime(object) {
        return object.updated_at;
      }

      function parseVersion(object) {
        return object.kit.name.match(/[0-9]+.?[0-9]*/)[0];
      }

      function parseOwner(object) {
        return {
          id: object.owner.id,
          username: object.owner.username,
          kits: object.owner.device_ids,
          city: object.owner.location.city,
          country: COUNTRY_CODES[object.owner.location.country_code],
          url: object.owner.url,
          avatar: object.owner.avatar
        };
      }

      function parseState(object) {
        var name = parseStateName(object); 
        var className = classify(name); 
        
        return {
          name: name,
          className: className
        };
      }

      function parseStateName(object) {
        return 'Never published';
      }

      function parseAvatar(object) {
        return null;
      }

      function parseSensorTime(sensor) {
        return moment(sensor.recorded_at).format('');
      }

      function belongsToUser(kitsArray, kitID) {
        return _.some(kitsArray, function(kit) {
          return kit.id = kitID;
        });
      }

      // function convertTime(time) {
      //   return moment(time).format('YYYY-MM-DDThh:mm:ss') + 'Z';
      // }
    }
})();
