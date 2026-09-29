import {PlaceKind} from '../types/game';
export type Candidate={id:string;name:string;kind:PlaceKind;distanceM:number;public:boolean};
export type RouteStop={candidate:Candidate;purpose:'trace'|'world_challenge'|'confrontation'|'finale'};
const preferred:PlaceKind[]=['open_space','landmark','commercial','quiet'];
export function buildRoute(candidates:Candidate[],maxDistance=2500):RouteStop[]{
 const safe=candidates.filter(x=>x.public&&x.distanceM<=maxDistance);
 const chosen:Candidate[]=[];
 for(const kind of preferred){const c=safe.filter(x=>x.kind===kind&&!chosen.some(y=>y.id===x.id)).sort((a,b)=>a.distanceM-b.distanceM)[0];if(c)chosen.push(c)}
 while(chosen.length<4){const c=safe.filter(x=>!chosen.some(y=>y.id===x.id)).sort((a,b)=>a.distanceM-b.distanceM)[0];if(!c)break;chosen.push(c)}
 const purposes:RouteStop['purpose'][]=['trace','world_challenge','confrontation','finale'];
 return chosen.map((candidate,i)=>({candidate,purpose:purposes[i]??'world_challenge'}));
}
export const fallbackChallenges=['audio_memory','photo_observation','timeline_deduction','suspect_interview'] as const;