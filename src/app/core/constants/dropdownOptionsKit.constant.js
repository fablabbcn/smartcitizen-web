(function() {
  'use strict';

  /**
   * Dropdown options for kits
   * @constant
   * @type {Array}
   */

  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_KIT', [
      {text: 'SET UP', value: '1', href: '/kits/new'},
      {text: 'EDIT', value: '2', href: '/kits/edit/'},
      {text: 'DELETE', value: '3', href: '/kits/delete/'}
    ]);
})();
