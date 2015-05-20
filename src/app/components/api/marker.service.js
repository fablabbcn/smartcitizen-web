(function() {
  'use strict';

  angular.module('app.components')
    .factory('marker', marker);
    
    marker.$inject = ['$rootScope'];
    function marker($rootScope) {
      var currentMarker;

      var service = {
        setCurrentMarker: setCurrentMarker,
        getCurrentMarker: getCurrentMarker,
        dataLoaded: dataLoaded
      };
      return service;

      /////////////////

      function setCurrentMarker(marker) {
        currentMarker = marker;
      }

      function getCurrentMarker() {
        return currentMarker;
      }

      function dataLoaded() {
        $rootScope.$broadcast('markerLoaded');
      }
    }
})();
