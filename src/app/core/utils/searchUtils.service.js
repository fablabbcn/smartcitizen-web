

  
    .factory('searchUtils', searchUtils);


    searchUtils.$inject = [];
    function searchUtils() {
      var service = {
        parseLocation: parseLocation,
        parseName: parseName,
        parseIcon: parseIcon,
        parseIconType: parseIconType
      };
      return service;

      /////////////////

      function parseLocation(object) {
        var location = '';

        if(!!object.city) {
          location += object.city;
        }
        if(!!object.city && !!object.country) {
          location += ', '; 
        }
        if(!!object.country) {
          location += object.country;
        }

        return location;
      }

      function parseName(object) {
        var name = object.type === 'User' ? object.username : object.name;
        return name;
      }

      function parseIcon(object, type) {
        switch(type) {
          case 'User':
            return object.avatar;
          case 'Device':
            return 'assets/images/kit.svg';
          case 'Country':
          case 'City':
            return 'assets/images/location_icon_normal.svg';
        }
      }

      function parseIconType(type) {
        switch(type) {
          case 'Device':
            return 'div';
          default:
            return 'img';
        }
      }
    }

