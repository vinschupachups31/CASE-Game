import { describe, expect, it } from 'vitest';
import { CASE_2317 } from '../src/cases/23-17';
import { createRun, evidenceView, messageView, reduceGame, contradictionView, chapterSummary } from '../src/engine/gameEngine';
import { playthrough, simulate } from '../src/engine/simulator';
import { validateWord, validateYear } from '../src/engine/challengeEngine';
import { ask } from '../src/engine/interrogationEngine';
import { guardReply, characterContext } from '../src/engine/characterEngine';
import { buildTerrain, compass } from '../src/engine/worldEngine';
import { linkStatus } from '../src/engine/notebook';
import { RunState } from '../src/types/run';

function afterYear(year = '1927'): RunState {
  let run = createRun('normal', 't');
  run = reduceGame(run, { type: 'SET_FLAG', flag: 'ZONE_1_REACHED' });
  return reduceGame(run, { type: 'CAPTURE', slot: 'WORLD_01', raw: year, source: 'camera' });
}

describe('Case File — vérité canonique', () => {
  it('Marc est responsable', () => {
    expect(CASE_2317.truth.culprit).toBe('marc');
  });

  it('est gelé : aucune mutation possible', () => {
    expect(Object.isFrozen(CASE_2317)).toBe(true);
    expect(Object.isFrozen(CASE_2317.truth)).toBe(true);
    expect(() => {
      (CASE_2317.truth as { culprit: string }).culprit = 'leo';
    }).toThrow();
  });

  it('toutes les références internes existent', () => {
    const facts = new Set(CASE_2317.truth.facts.map((f) => f.id));
    for (const s of CASE_2317.suspects) for (const l of s.lies) expect(facts.has(l.hidesFactId)).toBe(true);
    for (const t of CASE_2317.timeline) expect(facts.has(t.factId)).toBe(true);
    const evidence = new Set(CASE_2317.evidence.map((e) => e.id));
    for (const id of CASE_2317.accusation.requiredEvidence) expect(evidence.has(id)).toBe(true);
  });
});

describe('Challenge Engine', () => {
  it('valide une année plausible', () => {
    expect(validateYear('1927')).toEqual({ ok: true, value: '1927', raw: '1927' });
    expect(validateYear('927').ok).toBe(false);
    expect(validateYear('3000').ok).toBe(false);
  });

  it('dérive la 3e lettre d’un mot de 6 lettres ou plus', () => {
    expect(validateWord('PHARMACIE')).toMatchObject({ ok: true, value: 'A' });
    expect(validateWord('Épicerie')).toMatchObject({ ok: true, value: 'I' });
    expect(validateWord('CAFÉ').ok).toBe(false);
  });
});

describe('Game Engine — progression', () => {
  it('la capture de WORLD_01 n’est possible que dans la zone', () => {
    const run = reduceGame(createRun('normal', 't'), { type: 'CAPTURE', slot: 'WORLD_01', raw: '1927', source: 'camera' });
    expect(run.variables.WORLD_01).toBeUndefined();
  });

  it('WORLD_01 = 1927 débloque CALL_1927.dat et Léo', () => {
    const run = afterYear();
    expect(run.variables.WORLD_01?.value).toBe('1927');
    expect(run.suspects).toEqual(['leo']);
    expect(evidenceView(run)[0].fileName).toBe('CALL_1927.dat');
  });

  it('une valeur invalide ne change rien et une variable ne se réécrit pas', () => {
    const run = afterYear();
    expect(reduceGame(run, { type: 'CAPTURE', slot: 'WORLD_01', raw: '1874', source: 'camera' })).toBe(run);
    expect(reduceGame(createRun(), { type: 'CAPTURE', slot: 'WORLD_01', raw: 'abc', source: 'camera' }).variables).toEqual({});
  });

  it('1927 + PHARMACIE → code 1927-A qui révèle Marc', () => {
    const run = reduceGame(afterYear(), { type: 'CAPTURE', slot: 'WORLD_02', raw: 'PHARMACIE', source: 'camera' });
    expect(run.suspects).toContain('marc');
    expect(evidenceView(run).find((e) => e.id === 'e02')?.fileName).toBe('NORA_1927-A.doc');
  });

  it('le mensonge de Léo déclenche le message de Sarah et une contradiction potentielle', () => {
    let run = afterYear();
    for (const e of ask(run, 'leo', 'Où étiez-vous après ?').events) run = reduceGame(run, e);
    expect(run.messages).toContain('sarah_01');
    expect(run.suspects).toContain('sarah');
    expect(run.contradictions).toContain('c_leo_home');
  });

  it('le message anonyme cite la valeur trouvée par le joueur', () => {
    let run = reduceGame(afterYear('1874'), { type: 'CAPTURE', slot: 'WORLD_02', raw: 'BOULANGERIE', source: 'camera' });
    run = reduceGame(run, { type: 'SET_FLAG', flag: 'WALKING_TO_ZONE_3' });
    expect(messageView(run, 'threat_01')?.lines).toEqual(['Tu progresses vite.', '1874 était une mauvaise idée.']);
    expect(run.messages).toContain('marc_01');
  });

  it('le chapitre I ne se termine pas trop tôt', () => {
    const run = afterYear();
    expect(reduceGame(run, { type: 'NEXT_CHAPTER' })).toBe(run);
  });

  it('une mission impossible a toujours un fallback', () => {
    let run = reduceGame(createRun('normal', 't'), { type: 'USE_FALLBACK', slot: 'WORLD_01' });
    run = reduceGame(run, { type: 'USE_FALLBACK', slot: 'WORLD_02' });
    expect(run.variables.WORLD_01?.source).toBe('fallback');
    expect(run.suspects).toEqual(expect.arrayContaining(['leo', 'marc']));
  });

  it('le reducer ne mute jamais l’état précédent', () => {
    const run = afterYear();
    const snapshot = JSON.stringify(run);
    reduceGame(run, { type: 'CAPTURE', slot: 'WORLD_02', raw: 'PHARMACIE', source: 'camera' });
    expect(JSON.stringify(run)).toBe(snapshot);
  });
});

describe('Interrogation Engine', () => {
  it('Marc esquive la question sur la valeur du joueur après la menace', () => {
    let run = reduceGame(afterYear(), { type: 'CAPTURE', slot: 'WORLD_02', raw: 'PHARMACIE', source: 'camera' });
    run = reduceGame(run, { type: 'SET_FLAG', flag: 'WALKING_TO_ZONE_3' });
    const answer = ask(run, 'marc', 'Comment connaissez-vous 1927 ?');
    expect(answer.topicId).toBe('marc_world01');
    for (const e of answer.events) run = reduceGame(run, e);
    expect(contradictionView(run).find((c) => c.id === 'c_marc_world01')?.label).toContain('1927');
  });

  it('choisit le sujet le plus précis (« où… après l’appel » ≠ « l’appel »)', () => {
    const run = afterYear();
    expect(ask(run, 'leo', 'Où étiez-vous après l’appel ?').topicId).toBe('leo_where');
    expect(ask(run, 'leo', 'Nora vous a appelé à 21:53 ?').topicId).toBe('leo_call');
  });

  it('un suspect non débloqué ne répond pas', () => {
    expect(ask(createRun(), 'marc', 'Vous connaissez Sarah ?').text).toBe('');
  });

  it('Sarah ment tant que la preuve e03 manque', () => {
    let run = afterYear();
    for (const e of ask(run, 'leo', 'Où étiez-vous ?').events) run = reduceGame(run, e);
    expect(ask(run, 'sarah', 'Sur quel dossier travaillait Nora ?').topicId).toBe('sarah_lie');
  });
});

describe('Character Engine — IA bornée', () => {
  it('rejette un horaire inventé et un aveu de Marc', () => {
    expect(guardReply('Je l’ai vue à 22:41.', 'leo')).toEqual({ ok: true });
    expect(guardReply('Je suis parti à 23:05.', 'leo').ok).toBe(false);
    expect(guardReply('D’accord… c’est moi.', 'marc').ok).toBe(false);
  });

  it('le contexte contient les mensonges, interdits et objectif', () => {
    const ctx = characterContext(afterYear(), 'marc');
    expect(ctx.objective).toMatch(/Léo/);
    expect(ctx.lies).toHaveLength(2);
    expect(ctx.playerEvidence[0]).toContain('CALL_1927.dat');
  });
});

describe('World Engine', () => {
  it('écarte les lieux privés ou dangereux', () => {
    const t = simulate('dense');
    expect(t.stops.every((s) => s.type !== 'place' || s.place.public)).toBe(true);
    expect(t.stops.some((s) => s.type === 'place' && s.place.id === 'x')).toBe(false);
  });

  it('complète avec des challenges sur place quand les lieux manquent', () => {
    const t = simulate('rural');
    expect(t.stops).toHaveLength(4);
    expect(t.stops.filter((s) => s.type === 'in_place')).toHaveLength(3);
    expect(buildTerrain([], 'short').stops.every((s) => s.type === 'in_place')).toBe(true);
  });

  it('respecte la distance max du mode', () => {
    expect(simulate('dense', 'short').zonesFound).toBe(3);
    expect(compass(95)).toBe('E');
  });
});

describe('Carnet', () => {
  it('distingue fait établi et hypothèse', () => {
    const run = afterYear();
    expect(linkStatus(run, 'leo', 'nora')).toEqual({ status: 'FAIT ÉTABLI', label: 'Appel 21:53' });
    expect(linkStatus(run, 'leo', 'marc').status).toBe('HYPOTHÈSE — PREUVES INSUFFISANTES');
  });
});

describe('Simulateur — test fondamental de l’architecture', () => {
  const dense = playthrough('dense');
  const small = playthrough('small');
  const rural = playthrough('rural');

  it('les routes et les variables diffèrent', () => {
    expect(dense.terrain.stops).not.toEqual(small.terrain.stops);
    expect(dense.run.variables.WORLD_01?.value).toBe('1927');
    expect(small.run.variables.WORLD_01?.value).toBe('1874');
    expect(chapterSummary(dense.run).code).toBe('1927-A');
    expect(chapterSummary(small.run).code).toBe('1874-U');
  });

  it('la vérité reste identique : Marc est responsable partout', () => {
    for (const { run } of [dense, small, rural]) {
      expect(run.chapter).toBe(2);
      expect(run.contradictions).toContain('c_marc_sarah');
      expect(run.accusation).toEqual({ suspectId: 'marc', correct: true });
    }
  });

  it('accuser Léo est faux, même avec toutes les preuves', () => {
    expect(playthrough('dense', 'leo').run.accusation).toEqual({ suspectId: 'leo', correct: false });
  });
});

describe('Profil d’enquêteur et rendez-vous', () => {
  it('le profil dépend de la façon de jouer', async () => {
    const { investigatorProfile, shareText } = await import('../src/engine/profile');
    expect(investigatorProfile(playthrough('dense').run).title).toBe('L’Œil');
    expect(investigatorProfile(reduceGame(createRun(), { type: 'USE_FALLBACK', slot: 'WORLD_01' })).title).toBe('L’Improvisateur');
    expect(shareText(playthrough('small').run)).toContain('Ma ville a écrit : 1874-U');
  });

  it('le chapitre suivant ouvre au prochain 07:42', async () => {
    const { nextUnlock } = await import('../src/engine/profile');
    const before = nextUnlock(new Date(2026, 8, 29, 6, 0));
    expect([before.getDate(), before.getHours(), before.getMinutes()]).toEqual([29, 7, 42]);
    const after = nextUnlock(new Date(2026, 8, 29, 22, 0));
    expect([after.getDate(), after.getHours(), after.getMinutes()]).toEqual([30, 7, 42]);
  });
});

describe('Modes — plus long = plus d’histoire, même vérité', () => {
  it('chaque mode ajoute des éléments', async () => {
    const { modeScope } = await import('../src/engine/modes');
    const [s, n, i] = (['short', 'normal', 'immersive'] as const).map((m) => modeScope(m));
    expect([s.witnesses.length, n.witnesses.length, i.witnesses.length]).toEqual([0, 1, 2]);
    expect([s.falseLeads.length, n.falseLeads.length, i.falseLeads.length]).toEqual([0, 1, 2]);
    expect([s.worldPuzzles, n.worldPuzzles, i.worldPuzzles]).toEqual([2, 2, 3]);
    expect(s.evidence < n.evidence && n.evidence < i.evidence).toBe(true);
  });

  it('un élément long n’apparaît pas dans une partie courte', () => {
    const short = playthrough('dense', 'marc', 'short').run;
    expect(short.evidence).not.toContain('e04');
    expect(short.variables.WORLD_03).toBeUndefined();
    const immersive = playthrough('dense', 'marc', 'immersive').run;
    expect(immersive.evidence).toEqual(expect.arrayContaining(['e04', 'e05']));
  });

  it('Marc reste responsable dans les trois modes', () => {
    for (const mode of ['short', 'normal', 'immersive'] as const) {
      expect(playthrough('small', 'marc', mode).run.accusation).toEqual({ suspectId: 'marc', correct: true });
    }
  });
});

describe('Appels — psychologie', () => {
  const leoRun = () => afterYear();

  it('poser une question sans se présenter braque la personne', async () => {
    const { startCall, askInCall } = await import('../src/engine/callEngine');
    const r = askInCall(startCall('leo'), leoRun(), 'Où étiez-vous après l’appel ?', 'neutral');
    expect(r.text).toMatch(/qui vous êtes/);
    expect(r.events).toEqual([]);
    expect(r.state.tension).toBeGreaterThan(10);
  });

  it('Léo se ferme sous la pression et finit par raccrocher', async () => {
    const { startCall, introduce, askInCall } = await import('../src/engine/callEngine');
    let s = introduce(startCall('leo'), 'honest').state;
    s = askInCall(s, leoRun(), 'Vous l’avez suivie ?', 'pressure').state;
    const r = askInCall(s, leoRun(), 'Vous l’avez suivie ?', 'pressure');
    expect(r.state.hungUp).toBe(true);
    expect(r.text).toMatch(/Ne me rappelez pas/);
  });

  it('avec empathie, Léo parle de l’appel ; sans confiance, il esquive', async () => {
    const { startCall, introduce, askInCall } = await import('../src/engine/callEngine');
    const warm = introduce(startCall('leo'), 'close').state;
    expect(askInCall(warm, leoRun(), 'Nora vous a appelé à 21:53 ?', 'empathy').text).toMatch(/elle avait peur/i);
    const cold = introduce(startCall('leo'), 'blunt').state;
    expect(askInCall(cold, leoRun(), 'Nora vous a appelé à 21:53 ?', 'neutral').guarded).toBe(true);
  });

  it('un mensonge ne demande pas de confiance, et rappeler reste possible', async () => {
    const { startCall, introduce, askInCall } = await import('../src/engine/callEngine');
    const s = introduce(startCall('leo'), 'blunt').state;
    const r = askInCall(s, leoRun(), 'Où étiez-vous après l’appel ?', 'neutral');
    expect(r.events.some((e) => e.type === 'STATEMENT')).toBe(true);
    const again = startCall('leo', 1);
    expect(again.hungUp).toBe(false);
    expect(again.trust).toBeLessThan(startCall('leo').trust);
  });

  it('Marc reste calme bien plus longtemps', async () => {
    const { startCall, introduce, askInCall } = await import('../src/engine/callEngine');
    let run = reduceGame(afterYear(), { type: 'CAPTURE', slot: 'WORLD_02', raw: 'PHARMACIE', source: 'camera' });
    let s = introduce(startCall('marc'), 'honest').state;
    for (let i = 0; i < 3; i++) s = askInCall(s, run, 'Vous connaissez Sarah ?', 'pressure').state;
    expect(s.hungUp).toBe(false);
  });
});

describe('Chapitre II — accusation', () => {
  const chapterTwo = () => {
    let run = afterYear();
    for (const e of ask(run, 'leo', 'Où étiez-vous après l’appel ?').events) run = reduceGame(run, e);
    run = reduceGame(run, { type: 'CAPTURE', slot: 'WORLD_02', raw: 'PHARMACIE', source: 'camera' });
    run = reduceGame(run, { type: 'SET_FLAG', flag: 'WALKING_TO_ZONE_3' });
    run = reduceGame(run, { type: 'NEXT_CHAPTER' });
    for (const e of ask(run, 'marc', 'Vous connaissez Sarah ?').events) run = reduceGame(run, e);
    return run;
  };

  it('la note de Nora ouvre le chapitre II et établit la contradiction de Marc', () => {
    const run = chapterTwo();
    expect(run.chapter).toBe(2);
    expect(evidenceView(run).find((e) => e.id === 'e03')?.fileName).toBe('NOTE_A.txt');
    expect(run.contradictions).toContain('c_marc_sarah');
  });

  it('avec la note, Sarah avoue', () => {
    const run = chapterTwo();
    expect(ask(run, 'sarah', 'Vous lui avez donné des fichiers ?').topicId).toBe('sarah_confess');
  });

  it('la bonne personne avec la bonne preuve : accusation retenue', async () => {
    const { accusationVerdict } = await import('../src/engine/gameEngine');
    const run = reduceGame(chapterTwo(), { type: 'ACCUSE', suspectId: 'marc', contradictionId: 'c_marc_sarah' });
    expect(accusationVerdict(run)?.outcome).toBe('sound');
  });

  it('la bonne personne sur une esquive ou une intuition : accusation fragile', async () => {
    const { accusationVerdict } = await import('../src/engine/gameEngine');
    for (const proof of ['c_marc_world01', 'intuition']) {
      const run = reduceGame(chapterTwo(), { type: 'ACCUSE', suspectId: 'marc', contradictionId: proof });
      expect(accusationVerdict(run)?.outcome).toBe('weak');
    }
  });

  it('la mauvaise personne : le verdict dit ce qu’elle cachait, et l’accusation est définitive', async () => {
    const { accusationVerdict } = await import('../src/engine/gameEngine');
    const run = reduceGame(chapterTwo(), { type: 'ACCUSE', suspectId: 'leo', contradictionId: 'c_leo_home' });
    const v = accusationVerdict(run)!;
    expect(v.outcome).toBe('wrong');
    expect(v.culprit.id).toBe('marc');
    expect(reduceGame(run, { type: 'ACCUSE', suspectId: 'marc', contradictionId: 'c_marc_sarah' })).toBe(run);
  });

  it('Sarah, ignorée au chapitre I, commence l’appel plus froide', async () => {
    const { startCall } = await import('../src/engine/callEngine');
    expect(startCall('sarah', 0, true).trust).toBeLessThan(startCall('sarah').trust);
  });
});

describe('Portraits — découverts au fil de l’enquête', () => {
  it('un suspect inconnu n’a aucun détail ; la photo de contact révèle les cheveux de Léo', async () => {
    const { revealedTraits } = await import('../src/engine/appearance');
    expect(revealedTraits(createRun(), 'leo')).toEqual([]);
    expect(revealedTraits(afterYear(), 'leo').map((t) => t.id)).toEqual(['leo_hair']);
  });

  it('répondre à Sarah est récompensé : elle décrit le sweat de Léo', async () => {
    const { newTraits } = await import('../src/engine/appearance');
    let run = afterYear();
    for (const e of ask(run, 'leo', 'Où étiez-vous après l’appel ?').events) run = reduceGame(run, e);
    const answered = reduceGame(run, { type: 'SET_FLAG', flag: 'SARAH_ANSWERED' });
    expect(newTraits(run, answered).map((n) => n.trait.id)).toEqual(['leo_hoodie']);
    expect(newTraits(run, reduceGame(run, { type: 'SET_FLAG', flag: 'SARAH_IGNORED' }))).toEqual([]);
  });

  it('en fin de partie, chaque portrait est complet selon le mode', async () => {
    const { revealedTraits, reachableTraits } = await import('../src/engine/appearance');
    let run = playthrough('dense', 'marc', 'normal').run;
    run = reduceGame(run, { type: 'SET_FLAG', flag: 'SARAH_CONFESSED' });
    run = reduceGame(run, { type: 'SET_FLAG', flag: 'LEO_OPENED_UP' });
    for (const id of ['leo', 'sarah', 'marc'] as const) expect(revealedTraits(run, id)).toHaveLength(reachableTraits(run, id).length);
    const short = playthrough('dense', 'marc', 'short').run;
    expect(reachableTraits(short, 'marc').map((t) => t.id)).not.toContain('marc_watch');
  });

  it('chaque détail a une source et une partie de portrait distincte', () => {
    for (const traits of Object.values(CASE_2317.appearance)) {
      expect(new Set(traits.map((t) => t.part)).size).toBe(traits.length);
      for (const t of traits) expect(t.source.length).toBeGreaterThan(10);
    }
  });
});

describe('Modes longs — témoins, fausses pistes, énigme du nombre', () => {
  it('le parcours saute les étapes absentes du mode', async () => {
    const { resolveStage } = await import('../src/ui/flow');
    expect(resolveStage('leadLeo', 'short')).toBe('mission2');
    expect(resolveStage('leadLeo', 'normal')).toBe('leadLeo');
    expect(resolveStage('paul', 'normal')).toBe('mission2');
    expect(resolveStage('ticket', 'short')).toBe('board');
    expect(resolveStage('mission3', 'normal')).toBe('ringSarah');
    expect(resolveStage('mission3', 'immersive')).toBe('mission3');
  });

  it('Paul contredit Léo : contradiction établie, mais Léo reste innocent', () => {
    let run = afterYear();
    for (const e of ask(run, 'leo', 'Où étiez-vous après l’appel ?').events) run = reduceGame(run, e);
    run = reduceGame(run, { type: 'SET_FLAG', flag: 'WITNESS_PAUL' });
    expect(contradictionView(run).find((c) => c.id === 'c_leo_followed')?.level).toBe('established');
    const accused = reduceGame(run, { type: 'ACCUSE', suspectId: 'leo', contradictionId: 'c_leo_followed' });
    expect(accused.accusation?.correct).toBe(false);
  });

  it('le nombre trouvé ouvre la clé USB de Nora', () => {
    const run = playthrough('dense', 'marc', 'immersive').run;
    expect(evidenceView(run).find((e) => e.id === 'e05')?.fileName).toBe('USB_12.zip');
  });

  it('les témoins ont leurs répliques dans la liste des voix', async () => {
    const { VOICE_LINES } = await import('../src/voice/lines');
    expect(VOICE_LINES.filter((l) => l.speaker === 'ines')).toHaveLength(3);
    expect(VOICE_LINES.filter((l) => l.speaker === 'paul')).toHaveLength(3);
  });
});
