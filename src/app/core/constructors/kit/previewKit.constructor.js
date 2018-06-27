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
        console.log(this);
        if (!object.kit || object.kit.id === 2 || object.kit.id === 3){
          this.dropdownOptions.push({text: 'SET UP', value: '1', href: 'kits/' + this.id + '/edit?step=2'});
        }
        this.dropdownOptions.push({text: 'EDIT', value: '2', href: 'kits/' + this.id + '/edit'});
        if (true) {
          this.dropdownOptions.push({text: 'UPLOAD CSV', value: '3', href: 'kits/' + this.id + '/upload'});
        }
      }
      PreviewKit.prototype = Object.create(Kit.prototype);
      PreviewKit.prototype.constructor = Kit;
      return PreviewKit;
    }]);
})();
