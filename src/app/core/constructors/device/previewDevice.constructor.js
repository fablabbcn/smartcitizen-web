(function () {
  'use strict';

  angular.module('app.components')
    .factory('PreviewDevice', ['Device', function (Device) {

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
        this.dropdownOptions.push({ text: 'EDIT', value: '1', href: 'kits/' + this.id + '/edit', icon: 'fa fa-edit' });
        this.dropdownOptions.push({ text: 'SD CARD UPLOAD', value: '2', href: 'kits/' + this.id + '/upload', icon: 'fa fa-sd-card' });
      }
      PreviewDevice.prototype = Object.create(Device.prototype);
      PreviewDevice.prototype.constructor = Device;
      return PreviewDevice;
    }]);
})();
