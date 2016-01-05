(function() {
  'use strict';

  angular.module('app.components')
    .factory('Sensor', ['sensorUtils', 'measurement', function(sensorUtils,
      measurement) {

      /*jshint camelcase: false */
      var measurementTypes;
      measurement.getTypes()
        .then(function(res) {
          measurementTypes = res;
        });

      /**
       * Sensor constructor
       * @param {Object} sensorData - Contains the data of a sensor sent from the API
       * @param {Array} sensorTypes - Contains generic data about types of sensors, such as id, name, description,..
       * @property {string} name - Name of sensor
       * @property {number} id - ID of sensor
       * @property {string} unit - Unit of sensor. Ex: %
       * @property {string} value - Last value sent. Ex: 95
       * @property {string} prevValue - Previous value before last value
       * @property {string} icon - Icon URL for sensor
       * @property {string} arrow - Icon URL for sensor trend(up, down or equal)
       * @property {string} color - Color that belongs to sensor
       * @property {string} fullDescription - Full Description for popup
       * @property {string} previewDescription - Short Description for dashboard. Max 140 chars
       */
      function Sensor(sensorData, sensorTypes) {

        this.id = sensorData.id;

        this.name = _.result(_.find(measurementTypes, {
          'id': sensorData.measurement_id
        }), 'name');

        this.unit = sensorData.unit;
        this.value = sensorUtils.getSensorValue(sensorData);
        this.prevValue = sensorUtils.getSensorPrevValue(sensorData);
        this.icon = sensorUtils.getSensorIcon(this.name);
        this.arrow = sensorUtils.getSensorArrow(this.value, this.prevValue);
        this.color = sensorUtils.getSensorColor(this.name);

        var description = sensorUtils.getSensorDescription(this.id,
          sensorTypes);
        this.fullDescription = description;
        this.previewDescription = description.length > 140 ? description.slice(
          0, 140).concat(' ... ') : description;
      }

      return Sensor;
    }]);
})();