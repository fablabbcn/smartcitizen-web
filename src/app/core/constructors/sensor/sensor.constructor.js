(function() {
  'use strict';

  angular.module('app.components')
    .factory('Sensor', ['sensorUtils', 'timeUtils', function(sensorUtils, timeUtils) {

      /**
       * Sensor constructor
       * @param {Object} sensorData - Contains the data of a sensor sent from the API
       * @property {string} name - Name of sensor
       * @property {number} id - ID of sensor
       * @property {string} unit - Unit of sensor. Ex: %
       * @property {string} value - Last value sent. Ex: 95
       * @property {string} prevValue - Previous value before last value
       * @property {string} lastReadingAt - last_reading_at for the sensor reading
       * @property {string} icon - Icon URL for sensor
       * @property {string} arrow - Icon URL for sensor trend(up, down or equal)
       * @property {string} color - Color that belongs to sensor
       * @property {object} measurement - Measurement
       * @property {string} fullDescription - Full Description for popup
       * @property {string} previewDescription - Short Description for dashboard. Max 140 chars
       * @property {string} tags - Contains sensor tags for filtering the view
       */
      function Sensor(sensorData) {

        this.id = sensorData.id;
        this.name = sensorData.name;
        this.unit = sensorData.unit;
        this.value = sensorUtils.getSensorValue(sensorData);
        this.prevValue = sensorUtils.getSensorPrevValue(sensorData);
        this.lastReadingAt = timeUtils.parseDate(sensorData.last_reading_at);
        this.icon = sensorUtils.getSensorIcon(this.name);
        this.arrow = sensorUtils.getSensorArrow(this.value, this.prevValue);
        this.color = sensorUtils.getSensorColor(this.name);
        this.measurement = sensorData.measurement;

        // Some sensors don't have measurements because they are ancestors
        if (sensorData.measurement) {
          var description = sensorData.measurement.description;
          this.fullDescription = description;
          this.previewDescription = description.length > 140 ? description.slice(
            0, 140).concat(' ... ') : description;
          this.is_ancestor = false;
        } else {
          this.is_ancestor = true;
        }

        // Get sensor tags
        this.tags = sensorData.tags;
      }

      return Sensor;
    }]);
})();