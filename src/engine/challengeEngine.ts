export type ChallengeKind='visible_year'|'visible_word'|'visible_number'|'color'|'audio_memory'|'photo_observation';
export type Challenge={kind:ChallengeKind;prompt:string;variable?:'year'|'letter'|'number'|'color'};
export const challenges:Challenge[]=[
 {kind:'visible_year',prompt:'Trouve autour de toi quelque chose portant une année.',variable:'year'},
 {kind:'visible_word',prompt:'Trouve un mot visible d’au moins 6 lettres.',variable:'letter'},
 {kind:'visible_number',prompt:'Trouve un nombre visible dans ton environnement.',variable:'number'},
 {kind:'color',prompt:'Trouve un objet d’une couleur dominante.',variable:'color'},
 {kind:'audio_memory',prompt:'Écoute la scène et identifie le son qui ne correspond pas.'},
 {kind:'photo_observation',prompt:'Observe la scène. Un détail sera important.'}
];
export function deriveLetter(word:string){const clean=word.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z]/g,'').toUpperCase();return clean.length>=3?clean[2]:clean[0]??'N'}
export function validateYear(v:string){const n=Number(v);return /^\d{4}$/.test(v)&&n>=1000&&n<=new Date().getFullYear()}