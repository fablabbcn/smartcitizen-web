import angular from 'angular';

import errorDecorator from './error.decorator';

import kitUtils from './kitUtils.service';
import mapUtils from './mapUtils.service';
import markerUtils from './markerUtils.service';
import searchUtils from './searchUtils.service';
import sensorUtils from './sensorUtils.service';
import timeUtils from './timeUtils.service';
import userUtils from './userUtils.service';
import utils from './utils.service';

export default angular.module('app.core.utils',[])
.config(errorDecorator)
.factory('kitUtils', kitUtils)
.factory('mapUtils', mapUtils)
.factory('markerUtils', markerUtils)
.factory('searchUtils', searchUtils)
.factory('sensorUtils', sensorUtils)
.factory('timeUtils', timeUtils)
.factory('userUtils', userUtils)
.factory('utils', utils)
.name;
