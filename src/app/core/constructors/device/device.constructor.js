(function() {
  'use strict';

  angular.module('app.components')
    .factory('Device', ['Sensor', 'deviceUtils', function(Sensor, deviceUtils) {

      /**
       * Device constructor.
       * @constructor
       * @param {Object} object - Object with all the data about the device from the API
       * @property {number} id - ID of the device
       * @property {string} name - Name of the device
       * @property {string} type - Type of device. Ex: SmartCitizen Device
       * @property {string} location - Location of device. Ex: Madrid, Spain; Germany; Paris, France
       * @property {string} avatar - URL that contains the user avatar
       * @property {Array} labels - System tags
       * @property {string} state - State of the device. Ex: Never published
       * @property {Array} userTags - User tags. Ex: ''
       */
      function Device(object) {
        this.id = object.id;
        this.name = object.name;
        // this.type = deviceUtils.parseType(object);
        // TODO - Refactor, define common type on device or markerutils
        this.type = 'Smart Citizen Kit'
        this.location = deviceUtils.parseLocation(object);
        this.avatar = deviceUtils.parseAvatar(object, this.type);
        this.labels = deviceUtils.parseSystemTags(object);
        this.state = deviceUtils.parseState(object);
        /*jshint camelcase: false */
        this.userTags = object.user_tags;
      }

      return Device;
    }]);
})();
