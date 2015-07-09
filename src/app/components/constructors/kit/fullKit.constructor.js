(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', ['Kit', 'Sensor', 'kitUtils', function(Kit, Sensor, kitUtils) {

      function FullKit(object) {
        Kit.call(this, object)

        this.version = kitUtils.parseVersion(object);
        this.lastTime = moment(kitUtils.parseTime(object)).fromNow(); 
        this.class = kitUtils.classify(kitUtils.parseType(object)); 
        this.description = object.description;
        this.owner = kitUtils.parseOwner(object);
        this.data = object.data.sensors;
      }

      FullKit.prototype = Object.create(Kit.prototype);
      FullKit.prototype.constructor = FullKit;

      FullKit.prototype.getSensors = function(options) {
        var data = [];
        var parsedSensors = this.data.map(function(sensor) {
          return new Sensor(sensor); 
        });

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
