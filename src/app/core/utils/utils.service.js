import moment from 'moment';





    utils.$inject = ['device', 'PreviewKit', '$q'];
    export default function utils(device, PreviewKit, $q) {
      var service = {
        parseKit: parseKit,
        parseKitTime: parseKitTime,
        parseSensorTime: parseSensorTime,
        convertTime: convertTime,
        getOwnerKits: getOwnerKits
      };
      return service;

      ///////////////////////////

      function parseKit(object) {
        var parsedKit = {
          kitName: object.device.name,
          kitType: parseKitType(object),
          kitLastTime: moment(parseKitTime(object)).fromNow(),
          kitLocation: parseKitLocation(object),
          kitLabels: parseKitLabels(object),
          kitClass: classify(parseTypeSlug(object))
        };
        return parsedKit;
      }

      function parseKitLocation(object) {
        var location = '';

        var city = object.data.location.city;
        var country = object.data.location.country;

        if(!!city) {
          location += city;
        }
        if(!!country) {
          location += ', ' + country;
        }

        return location;
      }

      function parseKitLabels(object) {
        return {
          status: object.status,
          exposure: object.data.location.exposure
        };
      }

      function parseKitType(object) {
        var kitType = !object.kit ? 'Unknown type': object.kit.name;
        return kitType;
      }

      function parseTypeSlug(object) {
        var kitType = !object.kit ? 'unknown': object.kit.slug;
        var kitTypeSlug = kitType.substr(0,kitType.indexOf(':')).toLowerCase();
        return kitTypeSlug;
      }

      function classify(kitType) {
        if(!kitType) {
          return '';
        }
        return kitType.toLowerCase().split(' ').join('_');
      }

      function parseKitTime(object) {
        /*jshint camelcase: false */
        return object.updated_at;
      }

      function parseSensorTime(sensor) {
        /*jshint camelcase: false */
        return moment(sensor.recorded_at).format('');
      }

      function convertTime(time) {
        return moment(time).toISOString();
      }

      function getOwnerKits(ids) {
        var deferred = $q.defer();
        var kitsResolved = 0;
        var kits = [];

        ids.forEach(function(id, index) {
          device.getDevice(id)
            .then(function(data) {
              kits[index] = new PreviewKit(data);
              kitsResolved++;

              if(ids.length === kitsResolved) {
                deferred.resolve(kits);
              }
            });
        });
        return deferred.promise;
      }
    }
