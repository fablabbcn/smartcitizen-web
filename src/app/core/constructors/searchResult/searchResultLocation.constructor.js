(function() {
  'use strict';

  angular.module('app.components')
    .factory('SearchResultLocation', ['SearchResult', function(SearchResult) {

      function SearchResultLocation(object) {
        SearchResult.call(this, object);

        this.lat = object.latitude;
        this.lng = object.longitude;
      }
      return SearchResultLocation;
    }]);

})();
