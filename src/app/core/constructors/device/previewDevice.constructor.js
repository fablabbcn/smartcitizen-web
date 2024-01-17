(function() {
  'use strict';

  angular.module('app.components')
    .factory('PreviewDevice', ['Device', function(Device) {

      /**
       * Preview Device constructor.
       * Used for devices stacked in a list, like in User Profile or Device states
       * @extends Device
       * @constructor
       * @param {Object} object - Object with all the data about the device from the API
       */
      function PreviewDevice(object) {
        Device.call(this, object);

        this.dropdownOptions = [];

        if (!object.device_id || object.device_id === 2 || object.device_id === 3) {
          this.dropdownOptions.push({text: 'SET UP', value: '1', href: 'devices/' + this.id + '/edit?step=2', icon: 'fa fa-wrench'});
        }
        this.dropdownOptions.push({text: 'EDIT', value: '2', href: 'devices/' + this.id + '/edit', icon: 'fa fa-edit'});
        if (object.device_id) {
          this.dropdownOptions.push({text: 'SD CARD UPLOAD', value: '3', href: 'devices/' + this.id + '/upload', icon: 'fa fa-sd-card'});
        }

      }
      PreviewDevice.prototype = Object.create(Device.prototype);
      PreviewDevice.prototype.constructor = Device;
      return PreviewDevice;
    }]);
})();
