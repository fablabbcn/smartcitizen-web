(function() {
  'use strict';

  angular.module('app.components')
    .factory('kitUtils', kitUtils);

    kitUtils.$inject = ['COUNTRY_CODES', 'device'];
    function kitUtils(COUNTRY_CODES, device) {
      var service = {
        parseLocation: parseLocation,
        parseLabels: parseLabels,
        parseUserTags: parseUserTags,
        parseType: parseType,
        classify: classify,
        parseTime: parseTime,
        parseVersion: parseVersion,
        parseOwner: parseOwner,
        parseState: parseState,
        parseAvatar: parseAvatar,
        belongsToUser: belongsToUser,
        parseSensorTime: parseSensorTime
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
        /*jshint camelcase: false */
        return object.system_tags;
      }

      function parseUserTags(object) {
        return object.user_tags;
      }

      function parseType(object) {
        if(!object.kit) {
          return;
        }
        var kitType;

        var genericKitData = device.getGenericKitData();
        /*jshint camelcase: false */
        var kit = genericKitData[object.kit_id];
        var kitName = kit && kit.name; 

        if((new RegExp('sck', 'i')).test(kitName)) { 
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
        /*jshint camelcase: false */
        return object.last_reading_at;
      }

      function parseVersion(object) {
        if(!object.kit) {
          return;
        }
        return object.kit.name.match(/[0-9]+.?[0-9]*/)[0];
      }

      function parseOwner(object) {
        return {
          id: object.owner.id,
          username: object.owner.username,
          /*jshint camelcase: false */
          kits: object.owner.device_ids,
          city: object.owner.location.city,
          country: COUNTRY_CODES[object.owner.location.country_code],
          url: object.owner.url,
          avatar: object.owner.avatar
        };
      }

      function parseState(status) {
        var name = parseStateName(status); 
        var className = classify(name); 
        
        return {
          name: name,
          className: className
        };
      }

      function parseStateName(object) {
        return object.state.replace('_', ' ');
      }

      function parseAvatar() {
        return './assets/images/sckit_avatar.jpg';
      }

      function parseSensorTime(sensor) {
        /*jshint camelcase: false */
        return moment(sensor.recorded_at).format('');
      }

      function belongsToUser(kitsArray, kitID) {
        return _.some(kitsArray, function(kit) {
          return kit.id === kitID;
        });
      }
    }
})();
