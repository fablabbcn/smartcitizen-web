(function() {
  'use strict';

  angular.module('app.components')
    .factory('deviceUtils', deviceUtils);

    deviceUtils.$inject = ['COUNTRY_CODES', 'device'];
    function deviceUtils(COUNTRY_CODES, device) {
      var service = {
        parseLocation: parseLocation,
        parseCoordinates: parseCoordinates,
        parseSystemTags: parseSystemTags,
        parseUserTags: parseUserTags,
        classify: classify,
        parseNotifications: parseNotifications,
        parseOwner: parseOwner,
        parseName: parseName,
        parseString: parseString,
        parseHardware: parseHardware,
        parseHardwareInfo: parseHardwareInfo,
        parseHardwareName: parseHardwareName,
        isPrivate: isPrivate,
        onlineStatus: onlineStatus,
        preciseLocation: preciseLocation,
        enableForwarding: enableForwarding,
        isLegacyVersion: isLegacyVersion,
        isSCKHardware: isSCKHardware,
        parseState: parseState,
        parseAvatar: parseAvatar,
        belongsToUser: belongsToUser,
        parseSensorTime: parseSensorTime
      };

      return service;

      ///////////////

      function parseLocation(object) {
        var location = '';
        var city = '';
        var country = '';

        if (object.location) {
          city = object.location.city;
          country = object.location.country;
          if(!!city) {
            location += city;
          }
          if(!!city && !!location) {
            location += ', '
          }
          if(!!country) {
            location += country;
          }
        }
        return location;
      }

      function parseCoordinates(object) {
        if (object.location) {
          return {
            lat: object.location.latitude,
            lng: object.location.longitude
          };
        }
        // TODO: Bug - what happens if no location?
      }

      function parseSystemTags(object) {
        /*jshint camelcase: false */
        return object.system_tags;
      }

      function parseUserTags(object) {
        return object.user_tags;
      }

      function parseNotifications(object){
        return {
          lowBattery: object.notify.low_battery,
          stopPublishing: object.notify.stopped_publishing
        }
      }

      function classify(kitType) {
        if(!kitType) {
          return '';
        }
        return kitType.toLowerCase().split(' ').join('_');
      }

      function parseName(object, trim=false) {
        if(!object.name) {
          return;
        }
        if (trim) {
          return object.name.length <= 41 ? object.name : object.name.slice(0, 35).concat(' ... ');
        }
        return object.name;
      }

      function parseHardware(object) {
        if (!object.hardware) {
          return;
        }

        return {
          name: parseString(object.hardware.name),
          type: parseString(object.hardware.type),
          description: parseString(object.hardware.description),
          version: parseVersionString(object.hardware.version),
          slug: object.hardware.slug,
          info: parseHardwareInfo(object.hardware.last_status_message)
        }
      }

      function parseString(str) {
          if (typeof(str) !== 'string') { return null; }
          return str;
      }

      function parseVersionString (str) {
          if (typeof(str) !== 'string') { return null; }
          var x = str.split('.');
          // parse from string or default to 0 if can't parse
          var maj = parseInt(x[0]) || 0;
          var min = parseInt(x[1]) || 0;
          var pat = parseInt(x[2]) || 0;
          return {
              major: maj,
              minor: min,
              patch: pat
          };
      }

      function parseHardwareInfo (object) {
        if (!object) { return null; } // null
        if (typeof(object) == 'string') { return null; } // FILTERED

        var id = parseString(object.id);
        var mac = parseString(object.mac);
        var time = Date(object.time);
        var esp_bd = parseString(object.esp_bd);
        var hw_ver = parseString(object.hw_ver);
        var sam_bd = parseString(object.sam_bd);
        var esp_ver = parseString(object.esp_ver);
        var sam_ver = parseString(object.sam_ver);
        var sam_commit = sam_ver.substring(
          sam_ver.indexOf("-")+1,
          sam_ver.lastIndexOf("-")
        )
        var esp_commit = esp_ver.substring(
          esp_ver.indexOf("-")+1,
          esp_ver.lastIndexOf("-")
        )

        return {
          id: id,
          mac: mac,
          time: time,
          esp_bd: esp_bd,
          hw_ver: hw_ver,
          sam_bd: sam_bd,
          esp_ver: esp_ver,
          sam_ver: sam_ver,
          sam_commit: sam_commit,
          esp_commit: esp_commit
        };
      }

      function parseHardwareName(object) {
        if (object.hasOwnProperty('hardware')) {
          if (!object.hardware.name) {
            return 'Unknown hardware'
          }
          return object.hardware.name;
        } else {
          return 'Unknown hardware'
        }
      }

      function isPrivate(object) {
        return object.data_policy.is_private;
      }

      function onlineStatus(object) {
        if (object.system_tags.includes('online')) {
          return 'online';
        } else if (object.system_tags.includes('offline')) {
          return 'offline'
        } else {
          return 'unknown'
        }
      }

      function preciseLocation(object) {
        return object.data_policy.precise_location;
      }

      function enableForwarding(object) {
        return object.data_policy.enable_forwarding	;
      }

      function isLegacyVersion (object) {
        if (!object.hardware || !object.hardware.version || object.hardware.version.major > 1) {
          return false;
        } else {
          if (object.hardware.version.major == 1 && object.hardware.version.minor <5 ){
            return true;
          }
          return false;
        }
      }

      function isSCKHardware (object){
        if (!object.hardware || !object.hardware.type || object.hardware.type != 'SCK') {
          return false;
        } else {
          return true;
        }
      }

      function parseOwner(object) {
        return {
          id: object.owner.id,
          username: object.owner.username,
          /*jshint camelcase: false */
          devices: object.owner.device_ids,
          city: object.owner.location.city,
          country: COUNTRY_CODES[object.owner.location.country_code],
          url: object.owner.url,
          profile_picture: object.owner.profile_picture
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

      function belongsToUser(devicesArray, deviceID) {
        return _.some(devicesArray, function(device) {
          return device.id === deviceID;
        });
      }
    }
})();
