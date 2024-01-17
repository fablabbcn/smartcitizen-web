(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullDevice', ['Device', 'Sensor', 'deviceUtils', function(Device, Sensor, deviceUtils) {

      /**
       * Full Device constructor.
       * @constructor
       * @extends Device
       * @param {Object} object - Object with all the data about the device from the API
       * @property {string} version - Device version. Ex: 1.0
       * @property {string} time - Last time device sent data in UTC format
       * @property {string} timeParsed - Last time device sent data in readable format
       * @property {string} timeAgo - Last time device sent data in 'ago' format. Ex: 'a few seconds ago'
       * @property {string} class - CSS class for device
       * @property {string} description - Device description
       * @property {Object} owner - Device owner data
       * @property {Array} data - Device sensor's data
       * @property {number} latitude - Device latitude
       * @property {number} longitude - Device longitude
       * @property {string} macAddress - Device mac address
       * @property {number} elevation
       */
      function FullDevice(object) {
        Device.call(this, object);

        // TODO - Refactor. Waiting for new type
        this.version = deviceUtils.parseVersion(object);
        this.time = deviceUtils.parseLastReadingAt(object);
        this.timeParsed = !this.time ? 'No time' : moment(this.time).format('MMMM DD, YYYY - HH:mm');
        this.timeAgo = !this.time ? 'No time' : moment(this.time).fromNow();
        // this.class = deviceUtils.classify(deviceUtils.parseTypeSlug(object));
        this.description = object.description;
        this.owner = deviceUtils.parseOwner(object);
        this.data = object.data.sensors;
        this.latitude = object.data.location.latitude;
        this.longitude = object.data.location.longitude;
        /*jshint camelcase: false */
        this.macAddress = object.mac_address;
        this.elevation = object.data.location.elevation;
        // TODO - Refactor
        // this.typeDescription = deviceUtils.parseTypeDescription(object);
      }

      FullDevice.prototype = Object.create(Device.prototype);
      FullDevice.prototype.constructor = FullDevice;

      FullDevice.prototype.getSensors = function(sensorTypes, options) {
        var sensors = _(this.data)
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
          return sensors;
      };

      return FullDevice;
    }]);
})();
