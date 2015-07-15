(function() {
  'use strict';

  angular.module('app.components')
    .factory('PreviewKit', ['Kit', 'kitUtils',function(Kit, kitUtils) {

      function PreviewKit(object) {
        Kit.call(this, object);

        this.state = kitUtils.parseState(object);
      }
      PreviewKit.prototype = Object.create(Kit.prototype);
      PreviewKit.prototype.constructor = Kit;

      return PreviewKit;
    }]);
})();
