  export default function timeUtils() {
    var service = {
      getSecondsFromDate: getSecondsFromDate,
      getCurrentRange: getCurrentRange,
      getToday: getToday,
      getSevenDaysAgo: getSevenDaysAgo,
      getDateIn: getDateIn,
      parseTime: parseTime,
      isSameDay: isSameDay,
      isWithin15min: isWithin15min,
      isWithin1Month: isWithin1Month,
      isWithin: isWithin
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


    function getSecondsFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange(fromDate, toDate) {
      return moment(toDate).diff(moment(fromDate), 'days');
    }

    function parseTime(time, format) {
      time = getSecondsFromDate(time);
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
  }
