(function() {
  'use strict';

  /**
   * Dropdown options for community button
   * @constant
   * @type {Array}
   */

  // TODO Move to burger one day
  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_COMMUNITY', [
      {text: 'Documentation', href: 'https://docs.smartcitizen.me/'},
      {text: 'Forum', href: 'https://forum.smartcitizen.me/'},
      {text: 'API Reference', href: 'https://developer.smartcitizen.me/'},
      {text: 'About', href: 'https://docs.smartcitizen.me/about/'},
      {text: 'Policy', href: 'https://api.smartcitizen.me/ui/policy/'}
    ]);
})();
