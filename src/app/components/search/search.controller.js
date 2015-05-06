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
            } else if(object.type === 'Device') {
              var newObj = {
                name: object.name,
                location: object.city + ', ' + object.country,
                image: ''
              };
              return newObj;
            } else if(object.type === 'User') {
              console.log('username', object.username);
              var newObj = {
                name: object.username,
                location: object.city + ', ' + object.country,
                image: object.avatar
              };
              console.log(newObj);
              return newObj;
            }
          });
        });
    }

  }