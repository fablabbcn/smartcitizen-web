(function() {
  'use strict';

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['animation'];
    function EditKitController(animation) {
      var vm = this;

      initialize();

      /////////////////

      function initialize() {
        animation.viewLoaded();
      }
    }
})();
