'use strict';

describe('Controller: User Profile', function() {
  // var user;

  beforeEach(module('app.components'));

  var UserProfileController,
      scope,
      mockUserConstructor,
      stateParams,
      mockKitsData,
      mockAuthService,
      deferredUser;

  beforeEach(inject(function($controller, $rootScope, $q) {
    scope = $rootScope.$new();
    deferredUser = $q.defer();
    mockUserConstructor = {
      getUser: function() {
        return Promise.resolve();
      }
    };

    UserProfileController = $controller('UserProfileController', {
      $scope: scope,
      $stateParams: { id: 4 },
      $location: {},
      utils: {},
      user: mockUserConstructor,
      device: {},
      alert: {},
      auth: {},
      userUtils: {},
      $timeout: function(callback, time) { callback()},
      animation: { viewLoaded: function() {} },
      NonAuthUser: {},
      $q: {},
      PreviewKit: {}
    });

    spyOn(mockUserConstructor, 'getUser').and.returnValue(deferredUser.promise);
    //spyOn(mockAnimationService, 'blur');
  }));
  describe('State', function() {
    beforeEach(() => {
      deferredUser.resolve({ username: 'ruben' });
      scope.$apply();
    })

    it('should expose a user instance', async function() {
      console.log(UserProfileController.user);
      expect(UserProfileController.user).toBeDefined();
      expect(UserProfileController.user).toEqual(jasmine.any(Object));
      expect(Object.keys(UserProfileController.user)).toEqual(['username']);
    });
    xit('should expose a kit instance', function() {
      expect(UserProfileController.kits).toBeDefined();
    });
    xit('should expose filterKits function', function() {
      expect(UserProfileController.filterKits).toEqual(jasmine.any(Function));
    });
    xit('should expose kits filtered', function() {

    });
    xit('should expose the status of the filter with value undefined by default', function() {
      expect(UserProfileController.status).toBeUndefined();
    });
  });

  describe('Events', function() {
    xit('should listen for the loggedIn event', function() {

    });

    xit('should update the page according to the loggedIn event handler', function() {

    });
  });
});
