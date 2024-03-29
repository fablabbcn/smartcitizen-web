(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensor', sensor);

    sensor.$inject = ['Restangular', 'timeUtils', 'sensorUtils'];
    function sensor(Restangular, timeUtils, sensorUtils) {
      var sensorTypes;
      callAPI().then(function(data) {
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
        return Restangular.all('sensors').getList({'per_page': 1000});
      }

      function setTypes(sensorTypes) {
        sensorTypes = sensorTypes;
      }

      function getTypes() {
        return sensorTypes;
      }

      function getSensorsData(deviceID, sensorID, dateFrom, dateTo) {
        var rollup = sensorUtils.getRollup(dateFrom, dateTo);
        dateFrom = timeUtils.convertTime(dateFrom);
        dateTo = timeUtils.convertTime(dateTo);

        return Restangular.one('devices', deviceID).customGET('readings', {'from': dateFrom, 'to': dateTo, 'rollup': rollup, 'sensor_id': sensorID, 'all_intervals': true});
      }
    }
})();
