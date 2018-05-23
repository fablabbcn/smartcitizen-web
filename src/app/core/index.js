import angular from 'angular';

import animation from './animation';
import api from './api';
import constants from './constants';
import constructors from './constructors';
import filters from './filters';
import utils from './utils';

export default angular.module('app.core', [
  animation,
  api,
  constants,
  constructors,
  filters,
  utils
])
.name;
