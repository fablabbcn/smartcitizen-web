

  
    SearchResultLocation.$inject = ['SearchResult'];
export default function SearchResultLocation(SearchResult) {

      /**
       * Search Result Location constructor
       * @extends SearchResult
       * @param {Object} object - Object that contains the search result data from API 
       * @property {number} lat - Latitude
       * @property {number} lng - Longitude
       */
      function SearchResultLocation(object) {
        SearchResult.call(this, object);

        this.lat = object.latitude;
        this.lng = object.longitude;
        this.layer = object.layer;
      }
      return SearchResultLocation;
    }


