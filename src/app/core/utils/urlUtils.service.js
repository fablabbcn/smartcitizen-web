(function() {
    'use strict';

    angular.module('app.components')
      .factory('urlUtils', urlUtils);

      function urlUtils() {
        var service = {
          get_path: get_path
        };
        return service;

        ///////////

        function get_path(url, placeholder, input) {
            return url.replace(placeholder, input);
        }

      }
  })();




