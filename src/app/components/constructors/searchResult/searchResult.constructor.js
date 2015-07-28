(function() {
  'use strict';

  angular.module('app.components')
    .factory('SearchResult', ['searchUtils', function(searchUtils) {

      function SearchResult(object) {
        if(object.type === 'Location') {
        } else {
          this.id = object.id;
          this.type = object.type;
          this.name = searchUtils.parseName(object);
          this.location = searchUtils.parseLocation(object);
          this.icon = object.type === 'User' ? './assets/images/avatar.svg' : './assets/images/kit.svg';
          this.iconType = object.type === 'User' ? 'svg' : 'div';
        }
      }
      return SearchResult;
    }]);
})();
