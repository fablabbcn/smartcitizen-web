import angular from 'angular';

import FullKit from './fullKit.constructor';
import HasSensorKit from './hasSensorKit.constructor';
import Kit from './kit.constructor';
import PreviewKit from './previewKit.constructor';


export default angular.module('app.core.kit',[])
.factory('FullKit', FullKit)
.factory('HasSensorKit', HasSensorKit)
.factory('Kit', Kit)
.factory('PreviewKit', PreviewKit)
.name;
