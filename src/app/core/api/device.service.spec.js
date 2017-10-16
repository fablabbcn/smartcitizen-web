  'use strict';

describe('Service: Device', function() {

  beforeEach(module('app.components'));

  var device, httpBackend;

  beforeEach(inject(function(_device_, $httpBackend) {
    device = _device_;
    httpBackend = $httpBackend;

    httpBackend.whenGET('/kits').respond([]);
  }));


  it('should contain an object', function() {
    expect(device).toEqual(jasmine.any(Object));
  });

  it('should have certain properties', function() {
    expect(Object.keys(device)).toContain('getDevice', 'getDevices', 'getAllDevices', 'getGenericKitData');
  });

  describe('Initialization', function() {
    it('should call #callGenericKitData', function() {
      httpBackend.flush();
      expect(device.getGenericKitData()).toEqual({});        
    });
  });

  describe('#getDevice', function() {
    it('should call for a single device', function() {
      httpBackend.whenGET('/devices/12').respond({
        name: 'Kit name',
        id: 12
      });

      device.getDevice(12)
        .then(function(res) {
          expect(Object.keys(res.plain())).toEqual(['name', 'id']);
        });
      httpBackend.flush();
    });
  });

  describe('#getDevices', function() {
    it('should get devices closed to a location', function() {
      httpBackend.whenGET('/devices?near=1,1').respond([
        {name: 'Kit name'},
        {name: 'dmed'}
      ]);

      device.getDevices({lat: 1, lng: 1})
        .then(function(res) {
          expect(Array.isArray(res.plain())).toEqual(true);
          expect(res.plain().length).toEqual(2);
        });
      httpBackend.flush();
    });
  });

  describe('getAllDevices', function() {
    it('should call for all world devices', function() {
      httpBackend.whenGET('/devices/world_map').respond([
        {name: 'Kit name'},
        {name: 'dmed'}
      ]);

      device.getAllDevices()
        .then(function(res) {
          expect(Array.isArray(res.plain())).toEqual(true);
          expect(res.plain().length).toEqual(2);
        });
      httpBackend.flush();
    });
  });
});
