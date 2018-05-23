  alert.$inject = ['$mdToast'];
  function alert($mdToast) {
    var service = {
      success: success,
      error: error,
      info: {
        noData: {
          visitor: infoNoDataVisitor,
          owner: infoNoDataOwner
        },
        longTime: infoLongTime,
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
        buttonAttributes: 'analytics-on="click" analytics-event="click" ' +
          'analytics-category="Offline Kit Comment Link"',
        href: '#disqus_thread'
      });
    }

    function infoNoDataOwner(kitID) {
      info('Woah! We couldn\'t locate this kit on the map because it hasn\'t published any data. Please, check ' +
        'its settings.',
        10000,
        {
          button: 'Kit settings',
          href: '/kits/edit/' + kitID
        });
    }


    function infoLongTime() {
      info('😅 It looks like this kit hasn\'t posted any data in a long ' +
        'time. Why not leave a comment to let its owner know?', 10000,
        {
          button: 'Leave comment',
          buttonAttributes: 'analytics-on="click" analytics-event="click" ' +
          'analytics-category="Long time No published Kit Comment Link"',
          href: '#disqus_thread'
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
          buttonAttributes: options && options.buttonAttributes,
          href: options && options.href
        }
      });
    }
  }
