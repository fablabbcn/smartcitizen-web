(function() {
  'use strict';

  /**
   * Dropdown options for user
   * @constant
   * @type {Array}
   */
  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_USER', [
      {divider: true, text: 'Hello,', href: './profile'},
      // {text: 'PROFILE', href: './profile'},
      {text: 'LOGOUT', href: './logout'}
    ]);
})();
