import angular from 'angular';

import auth from './auth.service';
import device from './device.service';
import file from './file.service';
import geolocation from './geolocation.service';
import measurement from './measurement.service';
import push from './push.service';
import search from './search.service';
import sensor from './sensor.service';
import tag from './tag.service';
import user from './user.service';


export default angular.module('app.core.api',[])
.factory('auth', auth)
.factory('device', device)
.factory('file', file)
.factory('geolocation', geolocation)
.factory('measurement', measurement)
.factory('push', push)
.factory('search', search)
.factory('sensor', sensor)
.factory('tag', tag)
.factory('user', user)
.name;
