'use strict';

describe('Controller: User Profile', function() {

  beforeEach(module('app'));

  var UserProfileController,
      scope,
      user,
      deferred;

  beforeEach(inject(function($controller, $rootScope, $q, _user_) {
    scope = $rootScope.$new();
    user = _user_;
    deferred = $q;
    
    spyOn(mockUserService, 'updateUser').and.returnValue(deferred.promise);
    //spyOn(mockAnimationService, 'blur'); 

    UserProfileController = $controller('SignupController', {
      $scope: scope, user: user
    });
    
    describe('State', function() {
      it('should expose user instance', function() {
        expect(UserProfileController.user).toBeDefined();
        expect(UserProfileController.user.prototype.constructor).toEqual('User');
      });
      it('should expose kit instances of the user', function() {
        expect(UserProfileController.kits).toBeDefined();
        expect(Array.isArray(UserProfileController.kits)).toBe(true);
        expect(UserProfileController.kits[0].prototype.constructor).toEqual('Kit');
      });
      it('should expose filterKits function', function() {
        expect(UserProfileController.filterKits).toBeDefined();
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
  }));
});
