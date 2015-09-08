(function() {
  'use strict';

  angular.module('app.components')
    .factory('Kit', ['Sensor', 'kitUtils', function(Sensor, kitUtils) {

      /**
       * Kit constructor. 
       * @constructor
       * @param {Object} object - Object with all the data about the kit from the API
       * @property {number} id - ID of the kit
       * @property {string} name - Name of the kit
       * @property {string} type - Type of kit. Ex: SmartCitizen Kit
       * @property {string} location - Location of kit. Ex: Madrid, Spain; Germany; Paris, France
       * @property {string} avatar - URL that contains the user avatar
       * @property {Array} labels - System tags
       * @property {string} state - State of the kit. Ex: Never published
       */
      function Kit(object) {
        this.id = object.id;
        this.name = object.name;
        this.type = kitUtils.parseType(object);
        this.location = kitUtils.parseLocation(object);
        this.avatar = kitUtils.parseAvatar(object, this.type);
        this.labels = kitUtils.parseLabels(object);
        this.state = kitUtils.parseState(object);
      }

      return Kit;
    }]);
})();
