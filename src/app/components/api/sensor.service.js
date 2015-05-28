(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensor', sensor);

    sensor.$inject = ['Restangular']
    function sensor(Restangular) {
      var sensorTypes;;

      var service = {
        callAPI: callAPI,
        setTypes: setTypes,
        getTypes: getTypes
      };
      return service;

      ////////////////

      function callAPI() {
        return Restangular.all('sensors').getList();
      }

      function setTypes(sensorTypes) {
        sensorTypes = sensorTypes;
      }

      function getTypes() {
        return sensorTypes;
      }
    }
})();