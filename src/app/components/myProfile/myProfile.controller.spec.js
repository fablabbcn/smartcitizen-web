'use strict';

describe('Controller: User Profile', function() {

  beforeEach(module('app.components'));

  var MyProfileController,
      scope,
      mockUserData,
      mockDevicesData,
      mockAlertService,
      deferred;

  beforeEach(inject(function($controller, $rootScope, $q) {
    scope = $rootScope.$new();
    deferred = $q;

    mockUserData = {
      username: 'Ruben'
    };

    mockDevicesData = [
      {name: 'Kit 1', id: 1},
      {name: 'Kit 2', id: 2}
    ];

    mockAlertService = {
      success: function(){},
      error: function(){}
    };


    // spyOn(mockUserService, 'updateUser').and.returnValue(deferred.promise);
    //spyOn(mockAnimationService, 'blur');

    MyProfileController = $controller('MyProfileController', {
      $scope: scope, userData: mockUserData, devicesData: mockDevicesData, alert: mockAlertService
    });
  }));

    describe('State', function() {
      it('should expose user instance', function() {
        expect(MyProfileController.user).toBeDefined();
        expect(MyProfileController.user).toEqual(jasmine.any(Object));
        expect(Object.keys(MyProfileController.user)).toEqual(['username']);
      });
      it('should expose device instances of the user', function() {
        expect(MyProfileController.devices).toBeDefined();
        expect(Array.isArray(MyProfileController.devices)).toBe(true);
        expect(_.map(MyProfileController.devices, 'id')).toEqual([1,2]);
      });
      it('should expose filterDevices function', function() {
        expect(MyProfileController.filterDevices).toBeDefined();
      });
      it('should expose updateUser function', function() {

      });
      it('should expose removeUser function', function() {

      });
    });

    describe('Synchronous calls', function() {

    });

    describe('Asynchronous calls', function() {

    });
});


