(function() {
  'use strict';

  angular.module('app.components')
    .factory('alert', alert);
  
  alert.$inject = ['$mdToast'];
  function alert($mdToast) {
    var service = {
      success: success,
      error: error,
      info: info
    };

    return service;

    ///////////////////

    function success(message) {
      toast('success', message);
    }

    function error(message) {
      toast('error', message);
    }

    function info(message) {
      toast('info', message);
    }

    function toast(type, message, position) {
      position = position === undefined ? 'top': position;

       $mdToast.show({
        controller: 'AlertController',
        controllerAs: 'vm',
        templateUrl: 'app/components/alert/alert' + type + '.html',
        hideDelay: 100000, //10000
        position: position,
        locals: {message: message}
      });
    }
  }
})();
