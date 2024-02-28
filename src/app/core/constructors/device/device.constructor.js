(function() {
  'use strict';

  angular.module('app.components')
    .factory('Device', ['deviceUtils', function(deviceUtils) {

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
        // Basic information
        this.id = object.id;
        this.name = object.name;
        this.state = deviceUtils.parseState(object);
        this.description = object.description;

        // TODO: Refactor, changed
        this.systemTags = deviceUtils.parseSystemTags(object);
        this.userTags = deviceUtils.parseUserTags(object);
        this.isPrivate = deviceUtils.isPrivate(object);
        this.notifications = deviceUtils.parseNotifications(object);
        this.lastReadingAt = deviceUtils.parseDate(object.last_reading_at);
        this.createdAt = deviceUtils.parseDate(object.created_at);
        this.updatedAt = deviceUtils.parseDate(object.updated_at);

        this.location = object.location;
        this.locationString = deviceUtils.parseLocation(object);
        this.hardware = deviceUtils.parseHardware(object);
        this.hardwareName = deviceUtils.parseHardwareName(this);
        this.isLegacy = deviceUtils.isLegacyVersion(this);
        this.isSCK = deviceUtils.isSCKHardware(this);
        // this.class = deviceUtils.classify(object); // TODO - Do we need this?

        this.avatar = deviceUtils.parseAvatar();
        /*jshint camelcase: false */
      }

      return Device;
    }]);
})();
