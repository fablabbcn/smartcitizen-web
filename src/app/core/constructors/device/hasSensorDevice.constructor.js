(function() {
  'use strict';

  angular.module('app.components')
    .factory('HasSensorDevice', ['Device', function(Device) {

      function HasSensorDevice(object) {
        Device.call(this, object);

        this.sensors = object.data.sensors;
        this.longitude = object.data.location.longitude;
        this.latitude = object.data.location.latitude;
      }

      HasSensorDevice.prototype = Object.create(Device.prototype);
      HasSensorDevice.prototype.constructor = Device;

      HasSensorDevice.prototype.sensorsHasData = function() {
        var parsedSensors = this.sensors.map(function(sensor) {
          return sensor.value;
        });

        return _.some(parsedSensors, function(sensorValue) {
          return !!sensorValue;
        });
      };

      return HasSensorDevice;
    }]);
})();
