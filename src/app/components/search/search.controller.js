'use strict';

angular.module('app.components')
  .controller('SearchController', SearchController);


  function SearchController($scope, search, $http) {
    var vm = this;
    
    vm.searchTextChange = searchTextChange;
    vm.selectedItemChange = selectedItemChange;
    vm.querySearch = querySearch;
   
    ///////////////////

    function searchTextChange(text) {
      console.log('text', text);
    }

    function selectedItemChange(item) {
      console.log('item', item);
    }

    function querySearch(query) {
      return search.globalSearch(query)
        .then(function(data) {
          console.log(data);
          if(data.length === 0) return data;

          return data.map(function(object) {
            if(object.type === 'Location') {
            } else {
              var location = parseLocation(object);
              var name = parseName(object);

              return {
                type: object.type,
                name: name,
                location: location,
                image: object.type === 'User' ? '/assets/images/avatar.svg' : '/assets/images/kit.svg'
              };
            }
          });
        });
    }

    function parseLocation(object) {
      var location = '';

      if(!!object.city) {
        location += object.city;
      }
      if(!!object.country) {
        location += ', ' + object.country;
      }

      return location;
    }

    function parseName(object) {
      var name = object.type === 'User' ? object.username : object.name;
      return !name ? 'No name' : name; 
    }

  }