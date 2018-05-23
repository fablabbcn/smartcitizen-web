

  
    .factory('mapUtils', mapUtils);

    mapUtils.$inject = [];
    function mapUtils() {
      var service = {
        getDefaultFilters: getDefaultFilters,
        setDefaultFilters: setDefaultFilters,
        canFilterBeRemoved: canFilterBeRemoved
      };
      return service;

      //////////////

      function getDefaultFilters(filterData, defaultFilters) {
        var obj = {};
        if(!filterData.indoor && !filterData.outdoor) {
          obj[defaultFilters.exposure] = true;          
        } 
        if(!filterData.online && !filterData.offline) {
          obj[defaultFilters.status] = true;            
        } 
        return obj;
      }

      function setDefaultFilters(filterData, defaultFilters) {
        var obj = {};
        if(!filterData.indoor || !filterData.outdoor) {
          obj.exposure = filterData.indoor ? 'indoor' : 'outdoor';
        } 
        if(!filterData.online || !filterData.offline) {
          obj.status = filterData.online ? 'online' : 'offline';
        }
        return obj;
      }

      function canFilterBeRemoved(filterData, filterName) {
        if(filterName === 'indoor' || filterName === 'outdoor') {
          return filterData.indoor && filterData.outdoor;
        } else if(filterName === 'online' || filterName === 'offline') {
          return filterData.online && filterData.offline;
        }
      }
    }

