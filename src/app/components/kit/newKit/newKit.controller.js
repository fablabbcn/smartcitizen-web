(function() {
  'use strict';

  angular.module('app.components')
    .controller('NewKitController', NewKitController);

    NewKitController.$inject = ['animation'];
    function NewKitController(animation) {
      var vm = this;

      initialize();

      //////////////

      function initialize() {
        animation.viewLoaded();
      }
    }
})();
