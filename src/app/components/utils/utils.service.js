(function() {
  'use strict';

  angular.module('app.components')
    .factory('utils', utils);


    function utils() {
      var service = {
        parseKit: parseKit
      };
      return service;

      ///////////////////////////

      function parseKit(object) {
        var parsedKit = {
          kitName: object.name,
          kitType: parseKitType(object),  
          kitLastTime: moment(object.updated_at).fromNow(), 
          kitLocation: parseKitLocation(object), 
          kitLabelOnline: object.status,
          kitLabelIndoor: object.data.location.exposure,
          kitClass: classify(parseKitType(object))      
        };
        return parsedKit;
      }

      function parseKitLocation(object) {
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

      function parseKitLabels(object) {
        var labels = [];

        labels.push(object.status);
        labels.push(object.data.location.exposure);

        return labels;
      }

      function parseKitType(object) {
        var kitType; 
        
        if((/SCK|sck/).test(object.kit.name)) { 
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
    }
})();
