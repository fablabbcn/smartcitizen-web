(function() {
  'use strict';

  angular.module('app.components')
    .factory('Kit', ['Sensor', 'kitUtils', function(Sensor, kitUtils) {

      function Kit(object) {

        this.id = object.device.id;
        this.name = object.device.name;
        this.type = kitUtils.parseType(object);
        this.location = kitUtils.parseLocation(object);
        this.avatar = kitUtils.parseAvatar(object);
        this.labels = kitUtils.parseLabels(object);    
      }

      return Kit;
    }]);
})();
