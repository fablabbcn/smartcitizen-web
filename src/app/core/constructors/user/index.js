import angular from 'angular';

import AuthUser from './authUser.constructor';
import NonAuthUser from './nonAuthUser.constructor';
import User from './user.constructor';

export default angular.module('app.core.user',[])
.factory('AuthUser', AuthUser)
.factory('NonAuthUser', NonAuthUser)
.factory('User', User)
.name;
