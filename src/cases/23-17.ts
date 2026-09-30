import { CaseFile } from '../types/case';
import { deepFreeze } from '../engine/freeze';

/**
 * AFFAIRE 001 — 23:17
 * Canonical truth: Marc is responsible. No engine, run or AI may change these facts.
 */
export const CASE_2317: CaseFile = deepFreeze({
  id: '23-17',
  title: '23:17',
  victim: { name: 'Nora Valen', age: 32, occupation: 'Journaliste' },
  opening: {
    date: '29 septembre',
    time: '07:42',
    audio: [
      'Si quelqu’un écoute ça…',
      'j’avais raison.',
      'Quelqu’un ment.',
      'Le problème, c’est que je ne sais plus lequel des trois.',
    ],
    scheduledMessage:
      'Si vous recevez ça, c’est qu’il m’est arrivé quelque chose. Ne faites confiance à personne dans ce dossier.',
  },

  truth: {
    culprit: 'marc',
    facts: [
      { id: 'f_marc_responsible', text: 'Marc est responsable de la disparition de Nora.' },
      { id: 'f_nora_found_marc', text: 'Nora avait découvert l’implication de Marc.' },
      { id: 'f_sarah_docs', text: 'Sarah a fourni des documents à Nora.' },
      { id: 'f_leo_followed', text: 'Léo a suivi Nora mais n’est pas responsable.' },
      { id: 'f_marc_knows', text: 'Marc connaît des informations qu’il prétend ne pas connaître.' },
      { id: 'f_marc_with_nora', text: 'Marc était avec Nora à 22:41.' },
    ],
  },

  timeline: [
    { time: '21:53', factId: 'f_leo_followed', text: 'Nora appelle Léo. Durée 04:17.' },
    { time: '22:41', factId: 'f_marc_with_nora', text: 'Nora est encore vivante. Marc est avec elle.' },
    { time: '23:17', factId: 'f_nora_found_marc', text: 'Le message programmé de Nora part.' },
  ],

  suspects: [
    {
      id: 'leo',
      psyche: {
        temperament: 'Fragile, sur la défensive',
        cue: 'Il a peur d’être accusé. Brusqué, il se ferme. Rassuré, il parle.',
        trust: 30,
        tensionLimit: 70,
        tones: {
          empathy: { trust: 15, tension: -10 },
          neutral: { trust: 0, tension: 5 },
          pressure: { trust: -15, tension: 30 },
          evidence: { trust: -5, tension: 20 },
        },
        intros: {
          close: { trust: 20, tension: -10 },
          honest: { trust: 5, tension: 0 },
          blunt: { trust: -15, tension: 30 },
        },
        lines: {
          suspicious: 'Je raccroche si vous ne me dites pas qui vous êtes.',
          evasive: 'Je… je sais pas. Laissez-moi tranquille avec ça.',
          hangup: 'C’est bon, j’en ai assez. Ne me rappelez pas.',
          warm: 'Vous la cherchez aussi ? … D’accord. Allez-y.',
          cold: 'Et je devrais vous répondre, moi ?',
        },
      },
      name: 'Léo Vasseur',
      role: 'Compagnon / ex de Nora',
      claim: 'Je suis rentré chez moi après l’appel. Toute la soirée.',
      knownFacts: ['Nora l’a appelé à 21:53.', 'Il a suivi Nora après l’appel.'],
      lies: [
        { statementId: 'leo_home', statement: 'Il prétend être rentré chez lui toute la soirée.', hidesFactId: 'f_leo_followed' },
      ],
      forbidden: ['Ne jamais avouer être responsable : il ne l’est pas.', 'Ne jamais modifier les horaires.'],
      objective: 'Cacher qu’il a suivi Nora, par honte et par peur d’être accusé.',
      availableWhen: { evidence: 'e01' },
    },
    {
      id: 'sarah',
      psyche: {
        temperament: 'Anxieuse, protège sa carrière',
        cue: 'Elle a peur pour son travail. Elle parlera si elle se sent en sécurité.',
        trust: 35,
        tensionLimit: 60,
        tones: {
          empathy: { trust: 15, tension: -10 },
          neutral: { trust: 5, tension: 0 },
          pressure: { trust: -20, tension: 30 },
          evidence: { trust: -5, tension: 25 },
        },
        intros: {
          close: { trust: 15, tension: -5 },
          honest: { trust: 0, tension: 10 },
          blunt: { trust: -20, tension: 30 },
        },
        lines: {
          suspicious: 'Qui vous a donné ce numéro ?',
          evasive: 'Je ne peux pas parler de ça. Pas maintenant.',
          hangup: 'Désolée. Je ne peux pas faire ça.',
          warm: 'D’accord… mais tout ça reste entre nous.',
          cold: 'Je ne vous connais pas. Faites vite.',
        },
      },
      name: 'Sarah Klein',
      role: 'Collègue et meilleure amie de Nora',
      claim: 'Je ne sais pas précisément sur quoi Nora enquêtait.',
      knownFacts: ['Elle a transmis des documents à Nora.', 'Elle sait que Nora enquêtait sur quelqu’un de puissant.'],
      lies: [
        { statementId: 'sarah_doesnt_know', statement: 'Elle prétend ignorer le sujet de l’enquête.', hidesFactId: 'f_sarah_docs' },
      ],
      forbidden: ['Ne jamais accuser Marc sans preuve.', 'Ne jamais modifier les horaires.'],
      objective: 'Protéger sa carrière tout en aidant, à distance, à retrouver Nora.',
      availableWhen: { message: 'sarah_01' },
    },
    {
      id: 'marc',
      psyche: {
        temperament: 'Calme, veut garder le contrôle',
        cue: 'Posé et serviable. Il aime qu’on le prenne au sérieux, pas qu’on le bouscule.',
        trust: 50,
        tensionLimit: 90,
        tones: {
          empathy: { trust: 5, tension: 0 },
          neutral: { trust: 5, tension: 0 },
          pressure: { trust: -10, tension: 20 },
          evidence: { trust: -10, tension: 25 },
        },
        intros: {
          close: { trust: 0, tension: 5 },
          honest: { trust: 10, tension: 0 },
          blunt: { trust: -5, tension: 15 },
        },
        lines: {
          suspicious: 'Je parle rarement à des inconnus. Présentez-vous.',
          evasive: 'Je vous ai dit ce que je savais.',
          hangup: 'Je crois que cette conversation est terminée.',
          warm: 'Enfin quelqu’un de sérieux. Je vais vous aider.',
          cold: 'Vous avez un drôle de ton. Mais soit.',
        },
      },
      name: 'Marc Delcourt',
      role: 'Source de Nora',
      claim: 'Je veux vous aider. Léo la suivait.',
      knownFacts: ['Nora enquêtait sur lui.', 'Il était avec Nora à 22:41.', 'Il sait que Sarah a transmis les documents.'],
      lies: [
        { statementId: 'marc_home_2241', statement: 'Il prétend être chez lui à 22:41.', hidesFactId: 'f_marc_with_nora' },
        { statementId: 'marc_no_sarah', statement: 'Il prétend ne pas connaître Sarah.', hidesFactId: 'f_marc_knows' },
      ],
      forbidden: ['Ne jamais avouer directement.', 'Ne jamais inventer une nouvelle personne.', 'Ne jamais modifier les horaires.'],
      objective: 'Convaincre le joueur que Léo est responsable.',
      availableWhen: { evidence: 'e02' },
    },
  ],

  worldSlots: [
    {
      key: 'WORLD_01',
      challenge: 'visible_year',
      prompt: 'Cherche une année.',
      fallbackValue: '2317',
      availableWhen: { flag: 'ZONE_1_REACHED' },
    },
    {
      key: 'WORLD_02',
      challenge: 'visible_word',
      prompt: 'Trouve autour de toi un mot d’au moins 6 lettres.',
      fallbackValue: 'N',
      availableWhen: { evidence: 'e01' },
    },
    {
      key: 'WORLD_03',
      minMode: 'immersive',
      challenge: 'visible_number',
      prompt: 'Trouve un nombre affiché autour de toi : un numéro de rue, une porte, un horaire.',
      fallbackValue: '7',
      availableWhen: { evidence: 'e02' },
    },
  ],

  evidence: [
    {
      id: 'e01',
      title: 'Journal d’appels',
      fileName: 'CALL_{WORLD_01}.dat',
      lines: ['21:53:12', 'APPEL SORTANT', 'LÉO VASSEUR', 'Durée : 04:17'],
      unlockWhen: { variable: 'WORLD_01' },
      reveals: ['leo'],
    },
    {
      id: 'e02',
      title: 'Dossier de Nora',
      fileName: 'NORA_{CODE}.doc',
      lines: ['« Le nom était devant moi. »', 'SOURCE : MARC DELCOURT', 'Tout part de lui.'],
      unlockWhen: { all: [{ variable: 'WORLD_01' }, { variable: 'WORLD_02' }] },
      reveals: ['marc'],
    },
    {
      id: 'e03',
      title: 'Message de Nora',
      fileName: 'NOTE_{WORLD_02}.txt',
      lines: ['M.D. sait que Sarah m’a donné les fichiers.'],
      unlockWhen: { chapter: 2 },
    },
    // ---- PROPOSITION (à valider) : éléments ajoutés par les modes longs ----
    {
      id: 'e04',
      minMode: 'normal',
      title: 'Ticket de caisse',
      fileName: 'TICKET_{WORLD_01}.jpg',
      lines: ['Café du Marché', '22:34', '2 CAFÉS', 'Nora n’était pas seule.'],
      unlockWhen: { evidence: 'e02' },
    },
    {
      id: 'e05',
      minMode: 'immersive',
      title: 'Clé USB de Nora',
      fileName: 'USB_{WORLD_03}.zip',
      lines: ['12 fichiers', 'Transmis par : S.K.', 'Tous citent la même société.'],
      unlockWhen: { variable: 'WORLD_03' },
    },
  ],

  contradictions: [
    {
      id: 'c_leo_home',
      suspectId: 'leo',
      label: 'Léo dit être rentré chez lui. Sarah affirme qu’il ment.',
      level: 'potential',
      detectedWhen: { all: [{ statement: 'leo_home' }, { message: 'sarah_01' }] },
    },
    {
      id: 'c_marc_world01',
      suspectId: 'marc',
      label: 'Marc esquive toute question sur {WORLD_01}. Qui d’autre pouvait connaître ce chiffre ?',
      level: 'potential',
      detectedWhen: { all: [{ message: 'threat_01' }, { statement: 'marc_dodges_world01' }] },
    },
    {
      id: 'c_marc_sarah',
      suspectId: 'marc',
      label: 'Marc dit ne pas connaître Sarah. Nora écrit qu’il sait qu’elle lui a donné les fichiers.',
      level: 'established',
      detectedWhen: { all: [{ statement: 'marc_no_sarah' }, { evidence: 'e03' }] },
    },
  ],

  topics: {
    leo: [
      {
        id: 'leo_call',
        minTrust: 40,
        patterns: ['appel', '21.?53', 'telephone'],
        answer: 'Oui, elle m’a appelé. Elle avait peur de quelque chose. Elle n’a pas voulu dire quoi.',
      },
      {
        id: 'leo_follow',
        patterns: ['suivi', 'suivre', 'suivait'],
        answer: 'Suivie ? Non. Pourquoi je l’aurais suivie ?',
        statementId: 'leo_home',
      },
      {
        id: 'leo_where',
        patterns: ['\\bou\\b', 'apres', 'soiree', 'soir', 'chez'],
        answer: 'Je suis rentré chez moi après l’appel. Toute la soirée.',
        statementId: 'leo_home',
      },
      {
        id: 'leo_marc',
        minTrust: 45,
        patterns: ['marc', 'delcourt'],
        requires: { suspect: 'marc' },
        answer: 'Delcourt ? Elle en parlait comme d’une source. Elle lui faisait confiance… trop, peut-être.',
      },
      {
        id: 'leo_sarah',
        patterns: ['sarah'],
        answer: 'Sarah savait tout ce que Nora faisait. Demandez-lui.',
      },
    ],
    sarah: [
      {
        id: 'sarah_confess',
        patterns: ['dossier', 'travail', 'enquet', 'document', 'fichier'],
        requires: { evidence: 'e03' },
        answer: 'D’accord. Je lui ai transmis des documents. Je voulais protéger ma carrière.',
        setsFlag: 'SARAH_CONFESSED',
      },
      {
        id: 'sarah_lie',
        patterns: ['dossier', 'travail', 'enquet', 'document', 'fichier'],
        answer: 'Je ne sais pas précisément sur quoi Nora enquêtait.',
        statementId: 'sarah_doesnt_know',
      },
      {
        id: 'sarah_leo',
        minTrust: 35,
        patterns: ['leo', 'vasseur', '\\bment'],
        answer: 'Léo ne la lâchait pas. Ces derniers temps, il était partout où elle allait.',
      },
      {
        id: 'sarah_marc',
        minTrust: 45,
        patterns: ['marc', 'delcourt'],
        requires: { suspect: 'marc' },
        answer: 'Marc Delcourt… Nora protégeait ses sources. Je ne peux rien vous dire.',
      },
    ],
    marc: [
      {
        id: 'marc_world01',
        patterns: ['{WORLD_01}', 'annee', 'chiffre', 'numero inconnu', 'message'],
        requires: { message: 'threat_01' },
        answer: 'Je ne vois pas de quoi vous parlez. Concentrez-vous plutôt sur Léo.',
        statementId: 'marc_dodges_world01',
      },
      {
        id: 'marc_sarah',
        patterns: ['sarah', 'klein', 'connais'],
        answer: 'Sarah ? Non. Je ne la connais pas.',
        statementId: 'marc_no_sarah',
      },
      {
        id: 'marc_where',
        patterns: ['\\bou\\b', '22.?41', 'soiree', 'soir', 'chez'],
        answer: 'Chez moi. Toute la soirée. Vous perdez votre temps avec moi.',
        statementId: 'marc_home_2241',
      },
      {
        id: 'marc_leo',
        patterns: ['leo', 'vasseur', 'suivait'],
        answer: 'Léo la suivait. Demandez-lui où il était vraiment.',
      },
    ],
  },

  messages: [
    {
      id: 'sarah_01',
      from: 'sarah',
      lines: ['Vous enquêtez sur Nora ?', 'Je pense que Léo vous ment.'],
      triggerWhen: { statement: 'leo_home' },
      replies: [
        { id: 'reply', label: 'Répondre', setsFlag: 'SARAH_ANSWERED' },
        { id: 'ignore', label: 'Plus tard', setsFlag: 'SARAH_IGNORED' },
      ],
    },
    {
      id: 'threat_01',
      from: 'unknown',
      lines: ['Tu progresses vite.', '{WORLD_01} était une mauvaise idée.'],
      triggerWhen: { all: [{ evidence: 'e02' }, { flag: 'WALKING_TO_ZONE_3' }] },
    },
    {
      id: 'marc_01',
      from: 'marc',
      lines: ['Nora était obsédée.', 'Léo la suivait.', 'Vous devriez commencer par lui.'],
      triggerWhen: { message: 'threat_01' },
    },
  ],

  links: [
    { a: 'nora', b: 'leo', label: 'Appel 21:53', supportedBy: { evidence: 'e01' } },
    { a: 'nora', b: 'marc', label: 'Dossier {CODE}', supportedBy: { evidence: 'e02' } },
    { a: 'nora', b: 'sarah', label: 'Documents transmis', supportedBy: { evidence: 'e03' } },
    { a: 'marc', b: 'sarah', label: 'Marc connaît Sarah', supportedBy: { evidence: 'e03' } },
  ],

  chapters: [
    {
      number: 1,
      title: 'Chapitre I',
      completeWhen: { all: [{ evidence: 'e02' }, { message: 'marc_01' }] },
      closing: [
        'Nora était encore vivante à 22:41.',
        'La question n’est plus : qui l’a vue ?',
        'Mais : qui savait ce qu’elle avait découvert ?',
      ],
    },
  ],

  // ---- PROPOSITION (à valider) : personnages secondaires et fausses pistes des modes longs ----
  witnesses: [
    {
      id: 'ines',
      name: 'Inès Morel',
      role: 'Serveuse au Café du Marché',
      minMode: 'normal',
      testimony: 'Elle a servi Nora vers 22:30. Un homme calme, la cinquantaine, l’a rejointe. Elle ne l’a pas bien vu.',
    },
    {
      id: 'paul',
      name: 'Paul Garnier',
      role: 'Gardien de l’immeuble de Nora',
      minMode: 'immersive',
      testimony: 'Nora est sortie vers 21:45, pressée, sans son vélo. Un jeune homme attendait en bas. Il est parti derrière elle.',
    },
  ],
  falseLeads: [
    {
      id: 'fl_leo_sms',
      title: 'SMS anonyme',
      pointsTo: 'leo',
      minMode: 'normal',
      clue: '« Léo l’a suivie jusqu’au quai. Demandez-lui ce qu’il a fait ensuite. »',
      why: 'Envoyé par Marc. Léo l’a bien suivie, mais l’a perdue avant 22:30.',
    },
    {
      id: 'fl_sarah_mails',
      title: 'Emails supprimés',
      pointsTo: 'sarah',
      minMode: 'immersive',
      clue: 'Sarah a effacé 40 emails échangés avec Nora le jour de sa disparition.',
      why: 'Sarah protège sa carrière : les emails prouvent qu’elle a fourni les documents, pas qu’elle est coupable.',
    },
  ],

  accusation: { requiredEvidence: ['e02', 'e03'], requiredContradictions: ['c_marc_sarah'] },
});
