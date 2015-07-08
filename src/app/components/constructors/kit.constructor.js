(function() {
  'use strict';

  angular.module('app.components')
    .factory('Kit', ['Sensor', function(Sensor) {

      function Kit(object, options) {
        if(options && options.type === 'preview') {
          this.id = object.device.id;
          this.name = object.device.name || 'No Name';
          this.type = parseKitType(object);
          this.location = parseKitLocation(object) || 'No location';
          this.avatar = parseKitAvatar(object);
          this.state = parseKitState(object);
          this.labels = parseKitLabels(object);
        } else {
          this.name = object.device.name;
          this.type = parseKitType(object);
          this.version = parseKitVersion(object);
          this.avatar = parseKitAvatar(object);
          this.lastTime = moment(parseKitTime(object)).fromNow(); 
          this.location = parseKitLocation(object);
          this.labels = parseKitLabels(object); 
          this.class = classify(parseKitType(object)); 
          this.id = object.device.id;
          this.description = object.description;
          this.owner = parseKitOwner(object);
          this.data = object.data.sensors;          
        }
      }

      Kit.prototype.getSensors = function(options) {
        var data = [];
        var parsedSensors = this.data.map(function(sensor) {
          return new Sensor(sensor); 
        });

        if(options.type === 'compare') {
          parsedSensors.unshift({
            name: 'NONE',
            color: 'white',
            // icon: './assets/images/sensor_icon.svg',
            id: -1
          });
        } 

        return parsedSensors.reduce(function(acc, sensor, index, arr) {
          if(sensor.name === 'BATTERY') {
            arr.splice(index, 1);
            
            if(options.type === 'main') {
              acc[0] = arr;              
              acc[1] = sensor;
            } else if(options.type === 'compare') {
              acc = arr;
            }
          }
          return acc;
        }, []);
      };

      return Kit;
    }]);

    /**
     * Util functions to parse kit data. List: 
     * -parseKit
     * -parseKitLocation
     * -parseKitLabels
     * -parseKitType
     * -classify
     * -parseKitTime
     * -parseKitVersion
     */

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
      var status = object.device.status === 'new' ? 'offline' : object.device.status;
      var exposure = object.data.location.exposure;
      return {
        status: status,
        exposure: exposure
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

    function parseKitVersion(object) {
      return object.kit.name.match(/[0-9]+.?[0-9]*/)[0];
    }

    function parseKitOwner(object) {
      return {
        id: object.owner.id,
        username: object.owner.username,
        kits: object.owner.device_ids,
        location: object.owner.location.city && object.owner.location.country ? object.owner.location.city + ', ' + object.owner.location.country : null,
        url: object.owner.url,
        avatar: object.owner.avatar
      };
    }

    function parseKitState(object) {
      var name = parseKitStateName(object); 
      var className = classify(name); 
      
      return {
        name: name,
        className: className
      };
    }

    function parseKitStateName(object) {
      return 'Never published';
    }

    function parseKitAvatar(object) {
      return null;
    }

    function getKits() {

    }

    function parseSensorTime(sensor) {
      return moment(sensor.recorded_at).format('');
    }

    function convertTime(time) {
      return moment(time).format('YYYY-MM-DDThh:mm:ss') + 'Z';
    }
})();