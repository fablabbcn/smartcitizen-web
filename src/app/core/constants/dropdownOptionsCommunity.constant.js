(function() {
  'use strict';

  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_COMMUNITY', [
      {text: 'Forum', href: 'https://forum.smartcitizen.me/'},
      {text: 'Documentation', href: 'http://docs.smartcitizen.me/#/'},
      {text: 'API Reference', href: 'http://api.smartcitizen.me/'},
      {text: 'Github', href: 'https://github.com/fablabbcn/Smart-Citizen-Kit'}        
    ]);
})();
