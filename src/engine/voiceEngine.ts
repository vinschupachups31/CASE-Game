import * as Speech from 'expo-speech';
export type Speaker='narrator'|'nora'|'leo'|'sarah'|'marc'|'unknown';
export type VoiceProfile={label:string;pitch:number;rate:number;gender:'male'|'female'|'neutral'};
export const VOICES:Record<Speaker,VoiceProfile>={
 narrator:{label:'Narrateur',pitch:0.9,rate:0.92,gender:'neutral'},
 nora:{label:'Nora Valen',pitch:1.1,rate:1.0,gender:'female'},
 leo:{label:'Léo Vasseur',pitch:1.05,rate:1.08,gender:'male'},
 sarah:{label:'Sarah Klein',pitch:1.15,rate:0.95,gender:'female'},
 marc:{label:'Marc Delcourt',pitch:0.75,rate:0.88,gender:'male'},
 unknown:{label:'Inconnu',pitch:0.5,rate:0.8,gender:'neutral'}
};
let cache:Speech.Voice[]|null=null;
async function frenchVoices(){if(!cache){try{cache=(await Speech.getAvailableVoicesAsync()).filter(v=>v.language?.toLowerCase().startsWith('fr'))}catch{cache=[]}}return cache}
const FEMALE=/(amelie|amélie|audrey|aurelie|marie|thomas-f|female|femme|fr-fr-x-frc|fr-fr-x-fra|siwis)/i;
const MALE=/(thomas|daniel|nicolas|male|homme|fr-fr-x-frd|fr-fr-x-vlf)/i;
export async function pickVoice(speaker:Speaker){const list=await frenchVoices();if(!list.length)return undefined;const g=VOICES[speaker].gender;const re=g==='female'?FEMALE:g==='male'?MALE:null;const hit=re?list.find(v=>re.test(v.name+' '+v.identifier)):undefined;return(hit??list[0]).identifier}
export async function speak(speaker:Speaker,text:string,onDone?:()=>void){
 Speech.stop();const p=VOICES[speaker];const voice=await pickVoice(speaker);
 Speech.speak(text,{language:'fr-FR',voice,pitch:p.pitch,rate:p.rate,onDone,onStopped:onDone,onError:onDone});
}
export function stopVoice(){Speech.stop()}
