(function() {
  'use strict';

  angular.module('app.components')
    .factory('Marker', function(utils, device, COUNTRY_CODES, MARKER_ICONS) {

      function Marker(deviceData) {
        var parsedMarker = parseMarker(deviceData);

        this.lat = deviceData.latitude;
        this.lng = deviceData.longitude;
        this.message = '<div class="popup"><div class="popup_top ' + parsedMarker.kitClass + '"><p class="popup_name">' + parsedMarker.kitName + '</p><p class="popup_type">' + parsedMarker.kitType + '</p><p class="popup_time"><md-icon md-svg-src="./assets/images/update_icon.svg"></md-icon>' + parsedMarker.kitLastTime + '</p></div><div class="popup_bottom"><p class="popup_location"><md-icon md-svg-src="./assets/images/location_icon_dark.svg"></md-icon>' + parsedMarker.kitLocation + '</p><div class="popup_labels"><span>' + parsedMarker.kitLabels.status + '</span><span>' + parsedMarker.kitLabels.exposure + '</span></div></div></div>';
        this.icon = parsedMarker.kitIcon;
        this.layer = 'realworld'; 
        this.myData = {
          id: deviceData.id,          
          labels: parsedMarker.kitLabels
        };
      }
      return Marker;

      function parseMarker(object) {
        return {
          kitName: parseMarkerName(object),
          kitType: parseMarkerType(object),  
          kitLastTime: moment(parseMarkerTime(object)).fromNow(), 
          kitLocation: parseMarkerLocation(object), 
          kitLabels: parseMarkerLabels(object),
          kitClass: classify(parseMarkerType(object)),
          kitIcon: parseMarkerIcon(parseMarkerLabels(object).status)
        };
      }

      function parseMarkerName(object) {
        var name = object.name || 'No data';
        return name.length > 30 ? name.slice(0, 30).concat(' ... ') : name;
      }

      function parseMarkerLocation(object) {
        var location = '';
        
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

      function parseMarkerLabels(object) {
        return {
          status: object.status,
          exposure: object.exposure
        };
      }

      function parseMarkerType(object) {
        var kitType; 

        var genericKitData = device.getGenericKitData();
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

      function parseMarkerTime(object) {
        return object.added_at;
      }

      function parseMarkerIcon(status) {
        var icon;

        if(status === 'offline') {
          icon = MARKER_ICONS.smartCitizenOffline
        } else {
          icon = MARKER_ICONS.smartCitizenOnline;
        }  
        return icon;
      }
    });


})();
