(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', ['Kit', 'Sensor', 'kitUtils', 'utils', function(Kit, Sensor, kitUtils, utils) {

      function FullKit(object) {
        Kit.call(this, object);

        this.version = kitUtils.parseVersion(object);
        this.time = kitUtils.parseTime(object);
        this.timeParsed = !this.time ? 'No time' : moment(this.time).format('MMMM DD, YYYY - HH:mm');
        this.timeAgo = !this.time ? 'No time' : moment(this.time).fromNow();
        this.class = kitUtils.classify(kitUtils.parseType(object)); 
        this.description = object.description;
        this.owner = kitUtils.parseOwner(object);
        this.data = object.data.sensors;
        this.latitude = object.data.location.latitude;
        this.longitude = object.data.location.longitude;
        this.macAddress = object.mac_address;
      }

      FullKit.prototype = Object.create(Kit.prototype);
      FullKit.prototype.constructor = FullKit;

      FullKit.prototype.getSensors = function(sensorTypes, options) {
        var sensors = _(this.data)
          .chain()
          .map(function(sensor) {
            return new Sensor(sensor, sensorTypes); 
          })
          .tap(function(sensors) {
            if(options.type === 'compare') {
              sensors.unshift({
                name: 'NONE',
                color: 'white',
                id: -1
              });
            }
          })
          .value();
          
          return sensors.reduce(function(acc, sensor, index, arr) {
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
