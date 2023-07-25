(function() {
  'use strict';

  angular.module('app.components')
    .factory('tag', tag);

    tag.$inject = ['Restangular'];
    function tag(Restangular) {
      var tags = [];
      var selectedTags = [];

      var service = {
        getTags: getTags,
        getSelectedTags: getSelectedTags,
        setSelectedTags: setSelectedTags,
        tagWithName: tagWithName,
        filterMarkersByTag: filterMarkersByTag
      };

      return service;

      /////////////////

      function getTags() {
        return Restangular.all('tags')
          .getList({'per_page': 200})
          .then(function(fetchedTags){
            tags = fetchedTags.plain();
            return tags;
          });
      }

      function getSelectedTags(){
        return selectedTags;
      }
      
      function setSelectedTags(tags){
        selectedTags = tags;
      }

      function tagWithName(name){
        var result = _.where(tags, {name: name});
        if (result && result.length > 0){
          return result[0];
        }else{
          return;
        }
      }

      function filterMarkersByTag(tmpMarkers) {
        var markers = filterMarkers(tmpMarkers);
        return markers;
      }

      function filterMarkers(tmpMarkers) {
        if (service.getSelectedTags().length === 0){
          return tmpMarkers;
        }
        return tmpMarkers.filter(function(marker) {
          var tags = marker.myData.tags;
          if (tags.length === 0){
            return false;
          }
          return _.some(tags, function(tag) {
            return _.includes(service.getSelectedTags(), tag);
          });
        });
      }
    }
})();
