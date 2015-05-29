(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensor', sensor);

    sensor.$inject = ['Restangular'];
    function sensor(Restangular) {
      var sensorTypes;
      callAPI().then(function(data) {
        console.log('sensors', data.plain());
        setTypes(data);
      });

      var service = {
        callAPI: callAPI,
        setTypes: setTypes,
        getTypes: getTypes,
        getSensorsData: getSensorsData
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

      function getSensorsData(deviceID, dateFrom, dateTo) {
        return Restangular.one('devices', deviceID).all('pg_readings').customGET();
      }
    }
})();
