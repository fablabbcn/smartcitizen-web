(function() {
  'use strict';

  angular.module('app.components')
    .factory('PreviewKit', function() {

      function PreviewKit(object) {
        Kit.call(this, object);

        this.id = object.device.id;
        this.name = object.device.name || 'No Name';
        this.type = parseKitType(object);
        this.location = parseKitLocation(object) || 'No location';
        this.avatar = parseKitAvatar(object);
        this.state = parseKitState(object);
        this.labels = parseKitLabels(object);
      }
      PreviewKit.prototype = Object.create(PreviewKit.prototype);
      PreviewKit.prototype.constructor = Kit;

      return PreviewKit;
    });
})();
