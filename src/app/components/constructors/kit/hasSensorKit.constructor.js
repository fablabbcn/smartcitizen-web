(function() {
  'use strict';

  angular.module('app.components')
    .factory('HasSensorKit', ['Kit', 'kitUtils', 'Sensor', function(Kit, kitUtils, Sensor) {

      function HasSensorKit(object) {
        Kit.call(this, object);

        this.data = object.data.sensors;
        this.longitude = object.data.location.longitude;
        this.latitude = object.data.location.latitude;
      }

      HasSensorKit.prototype = Object.create(Kit.prototype);
      HasSensorKit.prototype.constructor = Kit;

      HasSensorKit.prototype.sensorsHasData = function() {
        var parsedSensors = this.data.map(function(sensor) {
          return sensor.value
        });

        return _.some(parsedSensors, function(sensorValue) {
          return !!sensorValue;
        });
      };

      return HasSensorKit;
    }]);
})();
