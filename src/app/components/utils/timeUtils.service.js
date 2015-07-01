(function() {
  'use strict';

  angular.module('app.components')
    .factory('timeUtils', timeUtils);

  function timeUtils() {
    var service = {
      getSecondsFromDate: getSecondsFromDate,
      getCurrentRange: getCurrentRange,
      getToday: getToday,
      getSevenDaysAgo: getSevenDaysAgo,
      getDateIn: getDateIn,
      parseTime: parseTime,
      isSameDay: isSameDay
    };
    return service;

    ////////////

    function getDateIn(timeMS, format) {
      if(!format) return timeMS;
      var result;
      if(format === 'ms') {
        result = timeMS 
      } else if(format === 's') {
        result = timeMS / 1000;
      } else if(format === 'm') {
        result = timeMS / 1000 / 60
      } else if(format === 'h') {
        result = timeMS / 1000 / 60 / 60;
      } else if(format === 'd') {
        result = timeMS / 1000 / 60 / 60 / 24;
      }
      return result;
    }


    function getSecondsFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange(fromDate, toDate, options) {
      return moment(toDate).diff(moment(fromDate), 'days');
    }

    function parseTime(time, format) {
      var time = getSecondsFromDate(time);
      return getDateIn(time, format);
    }

    function getToday() {
      return (new Date()).getTime();
    }

    function getSevenDaysAgo() {
      return getSecondsFromDate( getToday() - (7 * 24 * 60 * 60 * 1000) );
    }

    function isSameDay(day1, day2) {
      day1 = moment(day1);
      day2 = moment(day2);

      if(day1.startOf('day').isSame(day2.startOf('day'))) {
        return true;
      }
      return false;
    }
  }
})();
