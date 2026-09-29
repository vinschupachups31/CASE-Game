import {CASE_2317} from '../cases/23-17';
export type InterrogationState={suspectId:'leo'|'sarah'|'marc';asked:string[];pressure:number};
export function answerLocal(state:InterrogationState,question:string,evidence:string[]=[]){
 const q=question.toLowerCase(); const s=CASE_2317.suspects.find(x=>x.id===state.suspectId)!;
 if(state.suspectId==='leo'&&/(où|ou|après|apres)/.test(q))return 'Je suis rentré chez moi après l’appel. Toute la soirée.';
 if(state.suspectId==='sarah'&&/(dossier|travail|enquête|enquete)/.test(q))return evidence.includes('e02')?'D’accord. Je lui ai transmis des documents. Je voulais protéger ma carrière.':'Je ne sais pas précisément sur quoi Nora travaillait.';
 if(state.suspectId==='marc'&&/(sarah|connais)/.test(q))return 'Sarah ? Non. Je ne la connais pas.';
 if(state.suspectId==='marc'&&/(1927|année|annee|code)/.test(q))return 'Je ne vois pas de quoi vous parlez. Concentrez-vous plutôt sur Léo.';
 return s.claim;
}