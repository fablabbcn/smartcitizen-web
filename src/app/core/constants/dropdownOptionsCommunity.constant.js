(function() {
  'use strict';

  /**
   * Dropdown options for community button
   * @constant
   * @type {Array}
   */

  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_COMMUNITY', [
      {text: 'About', href: '/about'},
      {text: 'Forum', href: 'https://forum.smartcitizen.me/'},
      {text: 'Documentation', href: 'http://docs.smartcitizen.me/'},
      {text: 'API Reference', href: 'http://new-apidocs.smartcitizen.me/'},
      {text: 'Github', href: 'https://github.com/fablabbcn/Smart-Citizen-Kit'},
      {text: 'Legal', href: '/policy'}
    ]);
})();
