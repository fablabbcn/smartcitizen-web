'use strict';

describe('Controller: User Profile', function() {
  // var user;

  beforeEach(module('app.components'));

  var UserProfileController,
      scope,
      mockUserConstructor,
      mockUserInstance,
      stateParams,
      mockDevicesData,
      mockAuthService;

  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new();

    mockUserInstance = {
      username: 'ruben'
    };

    stateParams = {
      id: 4
    };

    mockDevicesData = {

    };

    mockAuthService = {

    };

    UserProfileController = $controller('UserProfileController', {
      $scope: scope, User: mockUserConstructor, userData: mockUserInstance, $stateParams: stateParams,
       devicesData: mockDevicesData, auth: mockAuthService
    });

    //spyOn(mockUserService, 'post').and.returnValue($q.when({}));
    //spyOn(mockAnimationService, 'blur');
  }));
  describe('State', function() {
    it('should expose a user instance', function() {
      expect(UserProfileController.user).toBeDefined();
      expect(UserProfileController.user).toEqual(jasmine.any(Object));
      expect(Object.keys(UserProfileController.user)).toEqual(['username']);
    });
    it('should expose a kit instance', function() {
      expect(UserProfileController.devices).toBeDefined();
    });
    it('should expose filterDevices function', function() {
      expect(UserProfileController.filterDevices).toEqual(jasmine.any(Function));
    });
    it('should expose devices filtered', function() {

    });
    it('should expose the status of the filter with value undefined by default', function() {
      expect(UserProfileController.status).toBeUndefined();
    });
  });

  describe('Events', function() {
    it('should listen for the loggedIn event', function() {

    });

    it('should update the page according to the loggedIn event handler', function() {

    });
  });
});

