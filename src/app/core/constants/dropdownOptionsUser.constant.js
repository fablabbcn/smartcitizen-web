(function() {
  'use strict';

  /**
   * Dropdown options for user
   * @constant
   * @type {Array}
   */
  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_USER', [
      {divider: true, text: 'Hi,', href: './profile'},
      {text: 'My profile', href: './profile'},
      {text: 'Log out', href: './logout'}
    ]);
})();
