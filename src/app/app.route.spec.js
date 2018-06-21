// 'resolve' on ui-router normally doesn't throw any error if it's wrong so it can be painful to work with
// this tests cover only the resolve part on ui-router routes 
'use strict'; 

describe('Router', function() {

/*  beforeEach(module('app'));

  describe('Landing state', function() {
    var geolocationMock;

    beforeEach(function() {
      geolocationMock = {}
      
      module('app', function($provide) {
        $provide.value('geolocation', geolocationMock);
        $provide.value('initialMarkers', deviceMock);
      });
    });


    it('should have the right data resolved', function(done) {
      geolocationMock.callAPI = jasmine.createSpy('callAPI').and.returnValue('callAPI');
      inject(function($state, $rootScope){
        //  $rootScope.$apply(function(){
        //    $state.go("landing");
        //  });
        // console.log('state', $state.$current.resolve)
        //  setTimeout(function() {
        //   expect($state.current.name).toEqual("landing");          
        //   done();
        //  }, 1000);
        $state.transitionTo('landing');
        $rootScope.$apply();
        expect($state.current.name).toBe('landing');
      });
    });
  });

  describe('Home state(map)', function() {

  });

  describe('Kit state', function() {

  });

  describe('User Profile state', function() {

  });

  describe('My Profile state', function() {

  }); */
});
