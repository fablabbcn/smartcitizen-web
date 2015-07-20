(function() {
  'use strict';

  angular.module('app.components')
    .factory('Kit', ['Sensor', 'kitUtils', function(Sensor, kitUtils) {

      function Kit(object) {

        this.id = object.id;
        this.name = object.name;
        this.type = kitUtils.parseType(object);
        this.location = kitUtils.parseLocation(object);
        this.avatar = kitUtils.parseAvatar(object);
        this.labels = kitUtils.parseLabels(object);    
      }

      return Kit;
    }]);
})();
