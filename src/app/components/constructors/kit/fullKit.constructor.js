(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', ['Kit', 'Sensor', 'kitUtils', 'utils', function(Kit, Sensor, kitUtils, utils) {

      function FullKit(object) {
        Kit.call(this, object);

        this.version = kitUtils.parseVersion(object);
        this.lastTime = moment(kitUtils.parseTime(object)).fromNow(); 
        this.class = kitUtils.classify(kitUtils.parseType(object)); 
        this.description = object.description;
        this.owner = kitUtils.parseOwner(object);
        this.data = object.data.sensors;
        this.latitude = object.data.location.latitude;
        this.longitude = object.data.location.longitude;
        this.time = moment(utils.parseKitTime(object)).fromNow();
      }

      FullKit.prototype = Object.create(Kit.prototype);
      FullKit.prototype.constructor = FullKit;

      FullKit.prototype.getSensors = function(sensorTypes, options) {
        var parsedSensors = this.data
          .map(function(sensor) {
            return new Sensor(sensor, sensorTypes); 
          })
          // .sort(function(sensorA, sensorB) {
          //   return sensorA.id - sensorB.id;
          // });

        if(options.type === 'compare') {
          parsedSensors.unshift({
            name: 'NONE',
            color: 'white',
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

      return FullKit;
    }]); 
})();
