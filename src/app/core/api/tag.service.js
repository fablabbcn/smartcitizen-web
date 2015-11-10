(function() {
  'use strict';

  angular.module('app.components')
    .factory('tag', tag);

    tag.$inject = ['Restangular'];
    function tag(Restangular) {
      var service = {
        getTags: getTags
      };
      return service;

      /////////////////
      
      function getTags() {
        return Restangular.all('tags').getList();
      }
    }
})();
