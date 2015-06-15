(function() {
  'use strict';

  angular.module('app.components')
    .factory('utils', utils);

    utils.$inject = ['device', 'Kit'];
    function utils(device, Kit) {
      var service = {
        parseKit: parseKit,
        parseKitTime: parseKitTime,
        parseSensorTime: parseSensorTime,
        convertTime: convertTime,
        getOwnerKits: getOwnerKits
      };
      return service;

      ///////////////////////////

      function parseKit(object) {
        /*jshint camelcase: false */
        var parsedKit = {
          kitName: object.name,
          kitType: parseKitType(object),  
          kitLastTime: moment(parseKitTime(object)).fromNow(), 
          kitLocation: parseKitLocation(object), 
          kitLabels: parseKitLabels(object),
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
        return {
          status: object.status,
          exposure: object.data.location.exposure
        };
      }

      function parseKitType(object) {
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

      function parseKitTime(object) {
        return object.updated_at;
      }

      function parseSensorTime(sensor) {
        return moment(sensor.recorded_at).format('');
      }

      function convertTime(time) {
        return moment(time).format('YYYY-MM-DDThh:mm:ss') + 'Z';
      }

      function getOwnerKits(ids, cb) {
        var kitsResolved = 0;
        var kits = [];

        ids.forEach(function(id, index) {
          device.getDevice(id)
            .then(function(data) {
              kits[index] = new Kit(data, {type: 'preview'} );
              kitsResolved++;

              if(ids.length === kitsResolved) {
                cb(kits);
              }
            });
        });
      }
    }
})();
