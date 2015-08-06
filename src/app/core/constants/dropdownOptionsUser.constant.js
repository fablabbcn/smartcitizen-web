(function() {
  'use strict';

  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_USER', [
      {divider: true, text: 'Hello,'},
      {text: 'PROFILE', href: './profile'},
      {text: 'LOGOUT', href: './logout'}
    ]);
})();
