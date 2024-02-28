(function() {
  'use strict';

  angular.module('app.components')
    .factory('timeUtils', timeUtils);

  function timeUtils() {
    var service = {
      getSecondsFromDate: getSecondsFromDate,
      getMillisFromDate: getMillisFromDate,
      getCurrentRange: getCurrentRange,
      getToday: getToday,
      getHourBefore: getHourBefore,
      getSevenDaysAgo: getSevenDaysAgo,
      getDateIn: getDateIn,
      convertTime: convertTime,
      formatDate: formatDate,
      isSameDay: isSameDay,
      isWithin15min: isWithin15min,
      isWithin1Month: isWithin1Month,
      isWithin: isWithin,
      isDiffMoreThan15min: isDiffMoreThan15min,
      parseDate: parseDate
    };
    return service;

    ////////////

    function getDateIn(timeMS, format) {
      if(!format) {
        return timeMS;
      }

      var result;
      if(format === 'ms') {
        result = timeMS;
      } else if(format === 's') {
        result = timeMS / 1000;
      } else if(format === 'm') {
        result = timeMS / 1000 / 60;
      } else if(format === 'h') {
        result = timeMS / 1000 / 60 / 60;
      } else if(format === 'd') {
        result = timeMS / 1000 / 60 / 60 / 24;
      }
      return result;
    }

    function convertTime(time) {
      return moment(time).toISOString();
    }

    function formatDate(time) {
      return moment(time).format('YYYY-MM-DDTHH:mm:ss');
    }

    function getSecondsFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getMillisFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange(fromDate, toDate) {
      return moment(toDate).diff(moment(fromDate), 'days');
    }

    function getToday() {
      return (new Date()).getTime();
    }

    function getSevenDaysAgo() {
      return getSecondsFromDate( getToday() - (7 * 24 * 60 * 60 * 1000) );
    }

    function getHourBefore(date) {
      var now = moment(date);
      return now.subtract(1, 'hour').valueOf();
    }

    function isSameDay(day1, day2) {
      day1 = moment(day1);
      day2 = moment(day2);

      if(day1.startOf('day').isSame(day2.startOf('day'))) {
        return true;
      }
      return false;
    }

    function isDiffMoreThan15min(dateToCheckFrom, dateToCheckTo) {
      var duration = moment.duration(moment(dateToCheckTo).diff(moment(dateToCheckFrom)));
      return duration.as('minutes') > 15;
    }

    function isWithin15min(dateToCheck) {
      var fifteenMinAgo = moment().subtract(15, 'minutes').valueOf();
      dateToCheck = moment(dateToCheck).valueOf();

      return dateToCheck > fifteenMinAgo;
    }

    function isWithin1Month(dateToCheck) {
      var oneMonthAgo = moment().subtract(1, 'months').valueOf();
      dateToCheck = moment(dateToCheck).valueOf();

      return dateToCheck > oneMonthAgo;
    }

    function isWithin(number, type, dateToCheck) {
      var ago = moment().subtract(number, type).valueOf();
      dateToCheck = moment(dateToCheck).valueOf();

      return dateToCheck > ago;
    }

    function parseDate(object){
      var time = object;
      return {
        raw: time,
        parsed: !time ? 'No time' : moment(time).format('MMMM DD, YYYY - HH:mm'),
        ago: !time ? 'No time' : moment(time).fromNow()
      }
    }
  }
})();
