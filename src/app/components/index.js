import angular from 'angular';
import alert from './alert';
import apiKey from './apiKey';
import beta from './beta';
import chart from './chart';
import cookiesLaw from './cookiesLaw';
import dialog from './dialog';
import download from './download';
import home from './home';
import kit from './kit';
import kitList from './kitList';
import landing from './landing';
import layout from './layout';
import login from './login';
import map from './map';
import myProfile from './myProfile';
import passwordRecovery from './passwordRecovery';
import passwordReset from './passwordReset';
import picker from './picker';
import search from './search';
import signup from './signup';
import staticModule from './static';
import store from './store';
import tags from './tags';
import userProfile from './userProfile';

export default angular.module('app.components', [
	alert,
	apiKey,
	beta,
	chart,
	cookiesLaw,
	dialog,
	download,
	home,
	kit,
	kit,
	kitList,
	landing,
	layout,
	login,
	map,
	myProfile,
	passwordRecovery,
	passwordReset,
	picker,
	search,
	signup,
	staticModule,
	store,
	tags,
	userProfile
])
.name;
