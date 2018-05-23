

  
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
        parseSensorTime: parseSensorTime,
        parseTypeSlug: parseTypeSlug,
        parseTypeDescription: parseTypeDescription
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
        var kitType = !object.kit ? 'Unknown type': object.kit.name;
        return kitType; 
      }
      function parseTypeDescription(object) {
        var kitTypeDescription = !object.kit ? 'Unknown type': object.kit.description;
        return kitTypeDescription; 
      }

      function parseTypeSlug(object) {
        var kitType = !object.kit ? 'unknown': object.kit.slug;
        var kitTypeSlug = kitType.substr(0,kitType.indexOf(':')).toLowerCase();
        return kitTypeSlug;
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
        if(!object.kit || !object.kit.slug ) {
          return;
        }
        return {
          id: object.kit.id,
          hardware:  parseVersionName(object.kit.slug.split(':')[0]),
          release: parseVersionString(object.kit.slug.split(':')[1]),
          slug: object.kit.slug
        };
      }

      function parseVersionName (str) {
          if (typeof(str) !== 'string') { return false; }
          return str;
      }

      function parseVersionString (str) {
          if (typeof(str) !== 'string') { return false; }
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

