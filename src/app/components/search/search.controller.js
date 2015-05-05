'use strict';

angular.module('app.components')
  .controller('SearchController', SearchController);


  function SearchController($scope, search, $http) {
    var vm = this;
    
    vm.searchTextChange = searchTextChange;
    vm.selectedItemChange = selectedItemChange;
    vm.querySearch = querySearch;
  

    /*search.globalSearch('Ruben').then(function(data) {
      console.log('data', data.length);
      return data;
    });
    */

    /*$http.get('https://new-api.smartcitizen.me/v0/search?q=Rube')
      .success(function(data) {
      	console.log('data', data.length);
      })
    */
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
          console.log('data', data);
          return data;
        });

    }
  }