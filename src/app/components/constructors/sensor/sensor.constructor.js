(function() {
  'use strict';

  angular.module('app.components')
    .factory('Sensor', ['sensorUtils', function(sensorUtils) {

      function Sensor(sensorData, sensorTypes) {
        this.name = sensorUtils.getSensorName(sensorData);
        this.id = sensorData.id;
        this.unit = sensorUtils.getSensorUnit(this.name);
        this.value = sensorUtils.getSensorValue(sensorData);
        this.prevValue = sensorUtils.getSensorPrevValue(sensorData);
        this.icon = sensorUtils.getSensorIcon(this.name);
        this.arrow = sensorUtils.getSensorArrow(this.value, this.prevValue);
        this.color = sensorUtils.getSensorColor(this.name);
        this.description = sensorUtils.getSensorDescription(this.id, sensorTypes);
      }

      return Sensor; 
    }]);
})();
