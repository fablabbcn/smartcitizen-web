(function() {
  'use strict';

  angular.module('app.components')
    .factory('Device', ['deviceUtils', 'timeUtils', function(deviceUtils, timeUtils) {

      /**
       * Device constructor.
       * @constructor
       * @param {Object} object - Object with all the data about the device from the API
       * @property {number} id - ID of the device
       * @property {string} name - Name of the device
       * @property {string} state - State of the device. Ex: Never published
       * @property {string} description - Device description
       * @property {Array} systemTags - System tags
       * @property {Array} userTags - User tags. Ex: ''
       * @property {bool} isPrivate - True if private device
       * @property {Array} notifications - Notifications for low battery and stopped publishing
       * @property {Object} lastReadingAt - last_reading_at: raw, ago, and parsed
       * @property {Object} createdAt - created_at: raw, ago, and parsed
       * @property {Object} updatedAt - updated_at: raw, ago, and parsed
       * @property {Object} location - Location of device. Object with lat, long, elevation, city, country, country_code
       * @property {string} locationString - Location of device. Ex: Madrid, Spain; Germany; Paris, France
       * @property {Object} hardware - Device hardware field. Contains type, version, info, slug and name
       * @property {string} hardwareName - Device hardware name
       * @property {bool} isLegacy - True if legacy device
       * @property {bool} isSCK - True if SC device
       * @property {string} avatar - URL that contains the user avatar
       */
      function Device(object) {
        // Basic information
        this.id = object.id;
        this.name = object.name;
        this.state = deviceUtils.parseState(object);
        this.description = object.description;
        this.token = object.device_token;
        this.macAddress = object.mac_address;

        // Tags and dates
        this.systemTags = deviceUtils.parseSystemTags(object);
        this.userTags = deviceUtils.parseUserTags(object);
        this.isPrivate = deviceUtils.isPrivate(object);
        this.preciseLocation = deviceUtils.preciseLocation(object);
        this.enableForwarding = deviceUtils.enableForwarding(object);
        this.notifications = deviceUtils.parseNotifications(object);
        this.lastReadingAt = timeUtils.parseDate(object.last_reading_at);
        this.createdAt = timeUtils.parseDate(object.created_at);
        this.updatedAt = timeUtils.parseDate(object.updated_at);

        // Location
        this.location = object.location;
        this.locationString = deviceUtils.parseLocation(object);

        // Hardware
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
