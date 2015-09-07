(function() {
  'use strict';

  angular.module('app.components')
    .factory('PreviewKit', ['Kit', 'kitUtils',function(Kit, kitUtils) {

      function PreviewKit(object) {
        Kit.call(this, object);

        this.dropdownOptions = [
          {text: 'SET UP', value: '1', href: 'kits/new'},
          {text: 'EDIT', value: '2', href: 'kits/edit/' + this.id}
        ];
      }
      PreviewKit.prototype = Object.create(Kit.prototype);
      PreviewKit.prototype.constructor = Kit;

      return PreviewKit;

    }]);
})();
