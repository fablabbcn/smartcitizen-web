(function() {
  'use strict';

  angular.module('app.components')
    .factory('SearchResult', ['searchUtils', function(searchUtils) {

      /**
       * Search Result constructor
       * @param {Object} object - Object that belongs to a search result from API
       * @property {string} type - Type of search result. Ex: Country, City, User, Device
       * @property {number} id - ID of search result, only for user & device
       * @property {string} name - Name of search result, only for user & device
       * @property {string} location - Location of search result. Ex: 'Paris, France'
       * @property {string} icon - URL for the icon that belongs to this search result
       * @property {string} iconType - Type of icon. Can be either img or div
       */
      
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
