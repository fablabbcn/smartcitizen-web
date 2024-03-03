(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullDevice', ['Device', 'Sensor', 'deviceUtils', function(Device, Sensor, deviceUtils) {

      /**
       * Full Device constructor.
       * @constructor
       * @extends Device
       * @param {Object} object - Object with all the data about the device from the API
       * @property {Object} owner - Device owner data
       * @property {Array} data - Device sensor's data
       * @property {Array} sensors - Device sensors data
       * @property {Array} postProcessing - Device postprocessing
       */
      function FullDevice(object) {
        Device.call(this, object);

        this.owner = deviceUtils.parseOwner(object);
        this.postProcessing = object.postprocessing;
        this.data = object.data;
        this.sensors = object.data.sensors;
      }

      FullDevice.prototype = Object.create(Device.prototype);
      FullDevice.prototype.constructor = FullDevice;

      FullDevice.prototype.getSensors = function(sensorTypes, options) {
        var sensors = _(this.data.sensors)
          .chain()
          .map(function(sensor) {
            return new Sensor(sensor, sensorTypes);
          }).sort(function(a, b) {
            /* This is a temporary hack to set always PV panel at the end*/
            if (a.id === 18){ return -1;}
            if (b.id === 18){ return  1;}
            /* This is a temporary hack to set always the Battery at the end*/
            if (a.id === 17){ return -1;}
            if (b.id === 17){ return  1;}
            /* This is a temporary hack to set always the Battery at the end*/
            if (a.id === 10){ return -1;}
            if (b.id === 10){ return  1;}
            /* After the hacks, sort the sensors by id */
            return b.id - a.id;
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
          console.log(sensors)
          return sensors;
      };

      return FullDevice;
    }]);
})();
