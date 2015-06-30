(function() {
  'use strict';

  angular.module('app.components')
    .factory('timeUtils', timeUtils);

  function timeUtils() {
    var service = {
      getSecondsFromDate: getSecondsFromDate,
      getCurrentRange: getCurrentRange
    };
    return service;

    ////////////

    function getSecondsFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange(fromDate, toDate, options) {
      var timeMS = getSecondsFromDate(toDate) - getSecondsFromDate(fromDate);
      if(!options) return timeMS;
      if(options.format === 's') {
        return timeMS / 1000;
      } else if(options.format === 'm') {
        return timeMS / 1000 / 60;
      } else if(options.format === 'h') {
        return timeMS / 1000 / 60 / 60;
      } else if(options.format === 'd') {
        return timeMS / 1000 / 60 / 60 / 24;
      }
    }
  }
})();
