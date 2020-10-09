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

        this.dropdownOptions = [];

        if (!object.kit_id || object.kit_id === 2 || object.kit_id === 3) {
          this.dropdownOptions.push({text: 'SET UP', value: '1', href: 'kits/' + this.id + '/edit?step=2', icon: 'fa fa-wrench'});
        }
        this.dropdownOptions.push({text: 'EDIT', value: '2', href: 'kits/' + this.id + '/edit', icon: 'fa fa-edit'});
        if (object.kit_id) {
          this.dropdownOptions.push({text: 'SD CARD UPLOAD', value: '3', href: 'kits/' + this.id + '/upload', icon: 'fa fa-sd-card'});
        }

      }
      PreviewKit.prototype = Object.create(Kit.prototype);
      PreviewKit.prototype.constructor = Kit;
      return PreviewKit;
    }]);
})();
