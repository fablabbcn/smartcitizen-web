(function() {
  'use strict';

  angular.module('app.components')
    .factory('Kit', ['Sensor', 'kitUtils', function(Sensor, kitUtils) {

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
