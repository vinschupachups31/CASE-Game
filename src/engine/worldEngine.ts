import {Run} from '../types/game'; import {CASE_2317} from '../cases/23-17';
export function createRun(mode:Run['mode']='normal'):Run{return{id:'run-'+Date.now().toString(36),caseId:CASE_2317.id,mode,variables:[],evidence:CASE_2317.evidence.map(e=>({...e})),chapter:1}}
export function captureWorldVariable(run:Run,key:string,value:string):Run{return{...run,variables:[...run.variables,{key,value,source:'environment'}]}}
export function unlockEvidence(run:Run,id:string):Run{return{...run,evidence:run.evidence.map(e=>e.id===id?{...e,unlocked:true}:e)}}
export function buildAdaptiveCode(run:Run){const n=run.variables.find(v=>v.key==='year')?.value??'2317';const w=run.variables.find(v=>v.key==='letter')?.value??'N';return n+'-'+w}