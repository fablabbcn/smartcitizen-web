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
        parseLastReadingAt: parseLastReadingAt,
        parseOwner: parseOwner,
        parseName: parseName,
        parseVersion: parseVersion,
        parseId: parseId,
        parseType: parseType,
        parseState: parseState,
        parseAvatar: parseAvatar,
        belongsToUser: belongsToUser,
        parseSensorTime: parseSensorTime,
        // parseTypeSlug: parseTypeSlug,
        parseTypeDescription: parseTypeDescription
      };

      return service;

      ///////////////

      // TODO - Refactor Make an uniform representation on
      // devices and world_map to avoid checking for data or location?
      function parseLocation(object) {
        var location = '';
        var locationData = object.hasOwnProperty('data') ? object.data : object;
        var city = ''
        var country = ''
        if (object.hasOwnProperty('location')){
          if (locationData.location) {
            city = locationData.location.city;
            country = locationData.location.country;

            if(!!city) {
              location += city;
            }
            if(!!country) {
              location += ', ' + country;
            }
          }
        } else {
          city = locationData.city;
          var country_code = locationData.country_code;
          country = COUNTRY_CODES[country_code];

          if(!!city) {
            location += city;
          }
          if(!!country) {
            location += ', ' + country;
          }
        }
        return location;
      }

      function parseCoordinates(object) {
        var locationData = object.hasOwnProperty('data') ? object.data : object;

        if (object.hasOwnProperty('location')){
          if (locationData.location) {
            return {
              lat: locationData.location.latitude,
              lng: locationData.location.longitude
            };
          }
        } else {
          return {
            lat: locationData.latitude,
            lng: locationData.longitude
          };
        }
      }

      function parseSystemTags(object) {
        /*jshint camelcase: false */
        return object.system_tags;
      }

      function parseUserTags(object) {
        return object.user_tags;
      }

      // TODO - Refactor based on new hardware_description
      // TODO - Refactor Decide what we do with non sck devices (if any)
      function parseType(object) {
        // var deviceType;
        return 'Smart Citizen Kit'
      }
      // function parseType(object) {
      //   if (object.hasOwnProperty('kit')) {
      //     return !object.kit ? 'Unknown type': object.kit.name;
      //   } else {
      //     console.log(device)
      //     var kitBlueprints = device.getKitBlueprints();
      //     return !kitBlueprints[object.kit_id] ? 'Unknown type': kitBlueprints[object.kit_id].name;
      //   };
      // }

      // TODO Refactor - Consider if we take back this one
      function parseTypeDescription(object) {
        if (object.hasOwnProperty('kit')) {
          return !object.kit ? 'Unknown type': object.kit.description;
        } else {
          var kitBlueprints = device.getKitBlueprints();
          return !kitBlueprints[object.kit_id] ? 'Unknown type': kitBlueprints[object.kit_id].description;
        };
      }

      // function parseTypeSlug(object) {
      //   if (object.hasOwnProperty('kit')) {
      //     var kitType = !object.kit ? 'unknown': object.kit.slug;
      //   } else {
      //     var kitBlueprints = device.getKitBlueprints();
      //     var kitType = !kitBlueprints[object.kit_id] ? 'unknown': kitBlueprints[object.kit_id].slug;
      //   };
      //   var kitTypeSlug = kitType.substr(0,kitType.indexOf(':')).toLowerCase();
      //   return kitTypeSlug;
      // }

      function parseId(object) {
        return object.id;
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

      function parseLastReadingAt(object, fromNow=false) {
        var time = object.last_reading_at;
        if(!time) {
          if (fromNow) {
            return 'No time'
          }
          return;
        }
        if(fromNow){
          return moment(time).fromNow();
        }
        return time;
      }

      // TODO Refactor - Decide if we do this this way
      function parseVersion(object) {
        if (!object.hardware_info) {
          return;
        }
        // var deviceVersion;
        return {
          id: 26,
          hardware: 'SCK',
          release: '2.1',
          slug: null
        }
      }

      // // TODO - Refactor Version
      // function parseVersion(object) {
      //   if(!object.kit || !object.kit.slug ) {
      //     return;
      //   }
      //   return {
      //     // TODO - Refactor based on hardware information
      //     id: object.kit.id,
      //     hardware: parseVersionName(object.kit.slug.split(':')[0]),
      //     release: parseVersionString(object.kit.slug.split(':')[1]),
      //     slug: object.kit.slug
      //   };
      // }

      // function parseVersionName (str) {
      //     if (typeof(str) !== 'string') { return false; }
      //     return str;
      // }

      // function parseVersionString (str) {
      //     if (typeof(str) !== 'string') { return false; }
      //     var x = str.split('.');
      //     // parse from string or default to 0 if can't parse
      //     var maj = parseInt(x[0]) || 0;
      //     var min = parseInt(x[1]) || 0;
      //     var pat = parseInt(x[2]) || 0;
      //     return {
      //         major: maj,
      //         minor: min,
      //         patch: pat
      //     };
      // }

      function parseOwner(object) {
        return {
          id: object.owner.id,
          username: object.owner.username,
          /*jshint camelcase: false */
          // TODO - Refactor, check it didn't break anything
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

      // TODO - What is this?
      function belongsToUser(kitsArray, kitID) {
        return _.some(kitsArray, function(kit) {
          return kit.id === kitID;
        });
      }
    }
})();
