import angular from 'angular';

import kit from './kit';
import user from './user';
import Marker from './marker.constructor.js';
import Sensor from './sensor.constructor.js';

export default angular.module('app.core.constructors',[])
.factory('Marker', Marker)
.factory('Sensor', Sensor)
.name;
