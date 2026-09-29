import {Candidate,buildRoute} from './routeEngine';
export const denseCity:Candidate[]=[
{id:'a',name:'Grande place',kind:'open_space',distanceM:340,public:true},{id:'b',name:'Monument',kind:'landmark',distanceM:710,public:true},{id:'c',name:'Rue commerçante',kind:'commercial',distanceM:980,public:true},{id:'d',name:'Jardin public',kind:'quiet',distanceM:1420,public:true}];
export const smallTown:Candidate[]=[
{id:'a',name:'Place centrale',kind:'open_space',distanceM:260,public:true},{id:'b',name:'Bâtiment public',kind:'landmark',distanceM:540,public:true},{id:'c',name:'Centre',kind:'commercial',distanceM:820,public:true},{id:'d',name:'Espace calme',kind:'quiet',distanceM:1060,public:true}];
export function simulate(profile:'dense'|'small'){return buildRoute(profile==='dense'?denseCity:smallTown)}