(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', function() {

      function FullKit() {
        this.name = object.device.name;
        this.type = parseKitType(object);
        this.version = parseKitVersion(object);
        this.avatar = parseKitAvatar(object);
        this.lastTime = moment(parseKitTime(object)).fromNow(); 
        this.location = parseKitLocation(object);
        this.labels = parseKitLabels(object); 
        this.class = classify(parseKitType(object)); 
        this.id = object.device.id;
        this.description = object.description;
        this.owner = parseKitOwner(object);
        this.data = object.data.sensors;
      }

      FullKit.prototype = Object.create(Kit.prototype);
      FullKit.prototype.constructor = FullKit;

      return FullKit;
    }); 
})();
