(function(){
  'use strict';

  angular.module('app.components')
    .service('scktoolService', scktoolService);

  scktoolService.$inject = ['angularLoad', '$q'];
  function scktoolService(angularLoad, $q){
    var d = $q.defer();
    var scripts = [
      'scripts/scktool-app.js',
      'scripts/scktool-connector.js'
    ];
    var scriptsLoaded = 0;

    var service = {
      scktool: scktool
    };

    initialize();

    return service;

    //////////////////////////////

    function initialize(){
      load(scripts[scriptsLoaded]);
    }

    function load(scriptSrc){
      angularLoad.loadScript(scriptSrc)
        .then(function(){
          onScriptLoad();
        });
    }

    function onScriptLoad(){
      scriptsLoaded++;
      if(scriptsLoaded < scripts.length){
        load(scripts[scriptsLoaded]);
        return;
      }

      d.resolve();
    }

    function scktool(){
      return d.promise;
    }

  }
})();
