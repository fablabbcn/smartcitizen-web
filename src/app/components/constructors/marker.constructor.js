(function() {
  'use strict';

  angular.module('app.components')
    .factory('Marker', function(utils) {

      function Marker(deviceData) {
        var parsedKit = parseMarker(deviceData);

        this.lat = deviceData.latitude;
        this.lng = deviceData.longitude;
        this.message = '<div class="popup"><div class="popup_top ' + parsedKit.kitClass + '"><p class="popup_name">' + parsedKit.kitName + '</p><p class="popup_type">' + parsedKit.kitType + '</p><p class="popup_time"><md-icon md-svg-src="./assets/images/update_icon.svg"></md-icon>' + parsedKit.kitLastTime + '</p></div><div class="popup_bottom"><p class="popup_location"><md-icon md-svg-src="./assets/images/location_icon.svg"></md-icon>' + parsedKit.kitLocation + '</p><div class="popup_labels"><span>' + parsedKit.kitLabels.status + '</span><span>' + parsedKit.kitLabels.exposure + '</span></div></div></div>';
        this.status = deviceData.status;
        this.myData = {
          id: deviceData.id
        };
      }
      return Marker;
    });

    function parseMarker(object) {
      console.log('device', object.plain());
      return {
        kitName: object.name,
        kitType: parseMarkerType(object),  
        kitLastTime: moment(parseMarkerTime(object)).fromNow(), 
        kitLocation: parseMarkerLocation(object), 
        kitLabels: parseMarkerLabels(object),
        kitClass: classify(parseMarkerType(object))      
      };
    }

    function parseMarkerLocation(object) {
      var location = '';
      
      var city = object.city;
      var country //= COUNTRIES[object.country];

      if(!!city) {
        location += city;
      }
      if(!!country) {
        location += ', ' + country;
      }

      return location;
    }

    function parseMarkerLabels(object) {
      return {
        status: object.status,
        exposure: object.exposure
      };
    }

    function parseMarkerType(object) {
      var kitType; 

      // if((new RegExp('sck', 'i')).test(KIT_IDS[object.kit_id]) { 
      //   kitType = 'SmartCitizen Kit';
      // }
      // return kitType; 
    }

    function classify(kitType) {
      if(!kitType) {
        return '';
      }
      return kitType.toLowerCase().split(' ').join('_');
    }

    function parseMarkerTime(object) {
      return object.added_at;
    }

})();
