(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', ['Kit', 'Sensor', 'kitUtils', 'utils', function(Kit, Sensor, kitUtils, utils) {

      /**
       * Full Kit constructor.
       * @constructor
       * @extends Kit
       * @param {Object} object - Object with all the data about the kit from the API
       * @property {string} version - Kit version. Ex: 1.0
       * @property {string} time - Last time kit sent data in UTC format
       * @property {string} timeParsed - Last time kit sent data in readable format
       * @property {string} timeAgo - Last time kit sent data in 'ago' format. Ex: 'a few seconds ago'
       * @property {string} class - CSS class for kit
       * @property {string} description - Kit description
       * @property {Object} owner - Kit owner data
       * @property {Array} data - Kit sensor's data
       * @property {number} latitude - Kit latitude
       * @property {number} longitude - Kit longitude
       * @property {string} macAddress - Kit mac address
       * @property {number} elevation
       */
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
        this.elevation = object.data.location.elevation;
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
