export type PlaceKind='open_space'|'landmark'|'commercial'|'quiet';
export type WorldVariable={key:string;value:string;source:'environment'|'simulation'};
export type Evidence={id:string;title:string;detail:string;unlocked:boolean};
export type Suspect={id:'leo'|'sarah'|'marc';name:string;claim:string;truth:string;lies:string[]};
export type Run={id:string;caseId:string;mode:'short'|'normal'|'immersive';variables:WorldVariable[];evidence:Evidence[];chapter:number;};