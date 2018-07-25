(function() {
  'use strict';
  angular.module('app.components')
   .config(function ($provide) {
        $provide.decorator('$exceptionHandler', ['$delegate', function($delegate) {
          return function (exception, cause) {
            /*jshint camelcase: false */
            $delegate(exception, cause);
          };
        }]);

    });
})();
