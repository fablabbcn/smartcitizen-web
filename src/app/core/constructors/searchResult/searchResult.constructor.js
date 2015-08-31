(function() {
  'use strict';

  angular.module('app.components')
    .factory('SearchResult', ['searchUtils', function(searchUtils) {

      function SearchResult(object) {
        this.type = object.type;
        this.id = object.id;
        this.name = searchUtils.parseName(object);
        this.location = searchUtils.parseLocation(object);
        this.icon = searchUtils.parseIcon(object, this.type);
        this.iconType = searchUtils.parseIconType(this.type);
      }
      return SearchResult;
    }]);
})();
