(function() {
  'use strict';

  angular.module('app.components')
    .factory('alert', alert);
  
  alert.$inject = ['$mdToast'];
  function alert($mdToast) {
    var service = {
      success: success,
      error: error,
      info: {
        noData: infoNoData,
        generic: info
      }
    };

    return service;

    ///////////////////

    function success(message) {
      toast('success', message);
    }

    function error(message) {
      toast('error', message);
    }

    function infoNoData() {
      info('Woha! This kit has still not published any data yet. Leave a comment to its owner to make him/ her know', 10000, {button: true});
    }

    function info(message, delay, options) {
      if(options.button) {
        toast('infoButton', message, undefined, delay);
      } else {
        toast('info', message, undefined, delay);     
      }
    }

    function toast(type, message, position, delay) {
      position = position === undefined ? 'top': position;
      delay = delay === undefined ? 5000 : delay;

       $mdToast.show({
        controller: 'AlertController',
        controllerAs: 'vm',
        templateUrl: 'app/components/alert/alert' + type + '.html',
        hideDelay: delay,
        position: position,
        locals: {message: message}
      });
    }
  }
})();
