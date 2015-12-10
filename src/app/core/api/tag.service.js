(function() {
  'use strict';

  angular.module('app.components')
    .factory('tag', tag);

    tag.$inject = ['Restangular'];
    function tag(Restangular) {
      var service = {
        getTags: getTags,
        getSelectedTags: getSelectedTags,
        setSelectedTags: setSelectedTags,
        filterMarkersByTag: filterMarkersByTag
      };

      var selectedTags = [];

      return service;

      /////////////////
      
      function getTags() {
        return Restangular.all('tags').getList();
      }

      function getSelectedTags(){
        return selectedTags;
      }
      function setSelectedTags(tags){
        selectedTags = tags;
      }

      function filterMarkersByTag(tmpMarkers) {

        var service = this;

        return tmpMarkers.filter(function(marker) {
          var tags = marker.myData.tags;
          if (tags.length === 0 && service.getSelectedTags().length !== 0){
            return false;
          }
          return _.every(tags, function(tag) {
            return _.include(service.getSelectedTags(), tag);
          });
        });
      }
    }
})();
