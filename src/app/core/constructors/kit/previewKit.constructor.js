(function() {
  'use strict';

  angular.module('app.components')
    .factory('PreviewKit', ['Kit', function(Kit) {

      /** 
       * Preview Kit constructor.
       * Used for kits stacked in a list, like in User Profile or Kit states
       * @extends Kit
       * @constructor
       * @param {Object} object - Object with all the data about the kit from the API
       */
      function PreviewKit(object) {
        Kit.call(this, object);

        this.dropdownOptions = [
          {text: 'SET UP', value: '1', href: 'kits/edit/' + this.id + '?step=2'},
          {text: 'EDIT', value: '2', href: 'kits/edit/' + this.id}
        ];
      }
      PreviewKit.prototype = Object.create(Kit.prototype);
      PreviewKit.prototype.constructor = Kit;

      return PreviewKit;

    }]);
})();
