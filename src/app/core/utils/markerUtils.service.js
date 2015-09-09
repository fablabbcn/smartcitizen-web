(function() {
  'use strict';

  angular.module('app.components')
    .factory('markerUtils', markerUtils);

    markerUtils.$inject = ['device', 'kitUtils', 'COUNTRY_CODES', 'MARKER_ICONS'];
    function markerUtils(device, kitUtils, COUNTRY_CODES, MARKER_ICONS) {
      var service = {
        parseType: parseType,
        parseLocation: parseLocation,
        parseLabels: parseLabels,
        parseUserTags: parseUserTags,
        parseCoordinates: parseCoordinates,
        parseId: parseId,
        getIcon: getIcon,
        parseName: parseName,
        parseTime: parseTime,
        getMarkerIcon: getMarkerIcon
      };
      _.defaults(service, kitUtils);
      return service;

      ///////////////

      function parseType(object) {
        var kitType; 

        var genericKitData = device.getGenericKitData();
        /*jshint camelcase: false */
        var kit = genericKitData[object.kit_id];
        var kitName = kit && kit.name; 

        if((new RegExp('sck', 'i')).test(kitName)) { 
          kitType = 'SmartCitizen Kit';
        } else {
          kitType = 'Unknown Kit';
        }
        return kitType; 
      }

      function parseLocation(object) {
        var location = '';
        
        /*jshint camelcase: false */
        var city = object.city;
        var country_code = object.country_code;
        var country = COUNTRY_CODES[country_code];

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

      function parseCoordinates(object) {
        return {
          lat: object.latitude,
          lng: object.longitude
        };
      }

      function parseId(object) {
        return object.id;
      }

      function getIcon(labels) {
        var icon;

        if(hasLabel(labels, 'offline')) {
          icon = MARKER_ICONS.markerSmartCitizenOffline;
        } else {
          icon = MARKER_ICONS.markerSmartCitizenOnline;
        }  
        return icon;
      }

      function hasLabel(labels, targetLabel) {
        return _.some(labels, function(label) {
          return label === targetLabel;
        });
      }

      function parseName(object) {
        if(!object.name) {
          return;
        }
        return object.name.length <= 41 ? object.name : object.name.slice(0, 35).concat(' ... ');
      }

      function parseTime(object) {
        var time = object.data && object.data[''];
        if(!time) {
          return 'No time';
        }
        return moment(time).fromNow();
      }

      function getMarkerIcon(marker, state) {
        var markerType = marker.icon.className;

        if(state === 'active') {
          marker.icon = MARKER_ICONS[markerType + 'Active'];
          marker.focus = true;
        } else if(state === 'inactive') {
          var targetClass = markerType.split(' ')[0];
          marker.icon = MARKER_ICONS[targetClass];
        }
        return marker;
      }
    }
})();
