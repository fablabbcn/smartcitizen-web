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
          return data;
        });
    }
  }