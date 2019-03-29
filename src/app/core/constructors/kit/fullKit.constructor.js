(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', ['Kit', 'Sensor', 'kitUtils', function(Kit, Sensor, kitUtils) {

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
        this.class = kitUtils.classify(kitUtils.parseTypeSlug(object));
        this.description = object.description;
        this.owner = kitUtils.parseOwner(object);
        this.data = object.data.sensors;
        this.latitude = object.data.location.latitude;
        this.longitude = object.data.location.longitude;
        /*jshint camelcase: false */
        this.macAddress = object.mac_address;
        this.elevation = object.data.location.elevation;
        this.typeDescription = kitUtils.parseTypeDescription(object);
      }

      FullKit.prototype = Object.create(Kit.prototype);
      FullKit.prototype.constructor = FullKit;

      FullKit.prototype.getSensors = function(sensorTypes, options) {
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

      return FullKit;
    }]); 
})();
