(function() {
  'use strict';

  angular.module('app.components')
    .factory('layout', layout);


    function layout() {

      var kitHeight;

      var service = {
        setKit: setKit,
        getKit: getKit
      };
      return service;

      function setKit(height) {
        kitHeight = height;
      }

      function getKit() {
        return kitHeight;
      }
    }
})();
