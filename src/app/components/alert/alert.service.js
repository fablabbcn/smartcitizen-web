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
        noData: {
          visitor: infoNoDataVisitor,
          owner: infoNoDataOwner,
          private: infoDataPrivate,
        },
        longTime: infoLongTime,
        // TODO: Refactor, check why this was removed
        // inValid: infoDataInvalid,
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

    function infoNoDataVisitor() {
      info('Woah! We couldn\'t locate this kit on the map because it hasn\'t published any data. Leave a ' +
        'comment to let its owner know.',
        10000,
        {
          button: 'Leave comment',
          href: 'https://forum.smartcitizen.me/'
        });
    }

    function infoNoDataOwner() {
      info('Woah! We couldn\'t locate this kit on the map because it hasn\'t published any data.',
        10000);
    }

    function infoDataPrivate() {
      info('Device not found, or it has been set to private. Leave a ' +
        'comment to let its owner know you\'re interested.',
        10000,
        {
          button: 'Leave comment',
          href: 'https://forum.smartcitizen.me/'
        });
    }

    // TODO: Refactor, check why this was removed
    // function infoDataInvalid() {
    //   info('Device not found, or it has been set to private.',
    //     10000);
    // }

    function infoLongTime() {
      info('😅 It looks like this kit hasn\'t posted any data in a long ' +
        'time. Why not leave a comment to let its owner know?',
        10000,
        {
          button: 'Leave comment',
          href: 'https://forum.smartcitizen.me/'
        });
    }

    function info(message, delay, options) {
      if(options && options.button) {
        toast('infoButton', message, options, undefined, delay);
      } else {
        toast('info', message, options, undefined, delay);
      }
    }

    function toast(type, message, options, position, delay) {
      position = position === undefined ? 'top': position;
      delay = delay === undefined ? 5000 : delay;

       $mdToast.show({
        controller: 'AlertController',
        controllerAs: 'vm',
        templateUrl: 'app/components/alert/alert' + type + '.html',
        hideDelay: delay,
        position: position,
        locals: {
          message: message,
          button: options && options.button,
          href: options && options.href
        }
      });
    }
  }
})();
