




  measurement.$inject = ['Restangular'];

  export default function measurement(Restangular) {

    var service = {
      getTypes: getTypes,
      getMeasurement: getMeasurement

    };
    return service;

    ////////////////


    function getTypes() {
      return Restangular.all('measurements').getList({'per_page': 100});
    }

    function getMeasurement(mesID) {

      return Restangular.one('measurements', mesID).get();
    }
  }
