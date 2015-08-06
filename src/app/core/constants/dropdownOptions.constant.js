(function() {
  'use strict';

  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS', [
      {text: 'SET UP', value: '1', href: '#'},
      {text: 'EDIT', value: '2', href: '#'}
    ]);
})();
