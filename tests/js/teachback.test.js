import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTranscript,matchTeachback,teachbackTerms} from '../../viewer/teachback.js';
import {TERMS,T} from './fixtures/teachback-motor.js';
import {TEACHING_GUIDES} from '../../viewer/lesson_briefings.js';

const ALL=TERMS.flatMap(t=>t.terms.map(term=>term.id));
const missingIds=text=>matchTeachback(text,TERMS).missing.map(m=>m.termId);

test('normalization lowercases, strips accents, and turns hyphens, underscores and punctuation into single spaces',()=>{
  assert.equal(normalizeTranscript('  Giro PRÉ-CENTRAL, área_4;  Tálamo!\n'),'giro pre central area 4 talamo');
  assert.equal(normalizeTranscript('Braço posterior da cápsula interna'),'braco posterior da capsula interna');
  assert.equal(normalizeTranscript(null),'');
});
test('negative control naming nothing leaves all ten relationships missing',()=>{
  assert.equal(ALL.length,10);
  assert.deepEqual(missingIds(T.neg),ALL);
  assert.deepEqual(matchTeachback(T.neg,TERMS).named,[]);
  assert.deepEqual(missingIds(''),ALL);
});
test('near misses (ramus, hypothalamus, sub-cortical, steroid initiation, M1, sulco pré-central) name nothing',()=>{
  assert.deepEqual(missingIds(T.nearMiss),ALL);
});
test('complete pt-BR explanation names every relationship, with or without accents',()=>{
  assert.deepEqual(missingIds(T.ptPos),[]);
  assert.deepEqual(missingIds(T.ptPos.normalize('NFD').replace(/\p{M}+/gu,'')),[]);
});
test('English explanation omitting two relationships reports exactly those two, with label and step',()=>{
  const {named,missing}=matchTeachback(T.enOmit2,TERMS);
  assert.deepEqual(missing,[
    {termId:'thalamus-medial',label:'Thalamus as the medial neighbour',step:4},
    {termId:'level-cerebellar',label:'Cerebellar coordination route (SCP / DRTT)',step:9},
  ]);
  assert.equal(named.length,8);
});
test('hyphen, underscore and spacing variants of a synonym match the same term',()=>{
  for(const text of ['o trato córtico-espinhal','o trato cortico espinhal','o trato córtico_espinhal','the Corticospinal-Tract'])
    assert.ok(!missingIds(text).includes('level-projection'),text);
  assert.ok(!missingIds('giro pre-central').includes('precentral-bank'));
});
test('a simple s/es plural on the last word still matches; other suffixes do not',()=>{
  assert.ok(!missingIds('both posterior limbs').includes('posterior-limb'));
  assert.ok(!missingIds('the central sulcuses').includes('central-sulcus'));
  assert.ok(missingIds('a cerebellarity').includes('level-cerebellar'));
});
test('whole-word logic: a word containing a synonym, or a related adjective, is not a match',()=>{
  const capsule=[{step:2,terms:[{id:'internal-capsule',label:'Internal capsule',en:['capsule internal','internal capsule'],pt:['cápsula interna']}]}];
  assert.deepEqual(matchTeachback('capsular fibres run internally',capsule).missing.map(m=>m.termId),['internal-capsule']);
  assert.deepEqual(matchTeachback('the internal capsule',capsule).named,['internal-capsule']);
  assert.ok(missingIds('the hypothalamus').includes('thalamus-medial'));
  assert.ok(missingIds('plasma samples').includes('level-initiation'));
  assert.ok(!missingIds('the SMA').includes('level-initiation'));
});
test('rule 1: longest non-overlapping hit wins, so dentato-rubro-thalamic names only the cerebellar route',()=>{
  for(const text of ['the dentato-rubro-thalamic tract','o trato dentato-rubro-talâmico','dentato rubro thalamic']){
    const {named}=matchTeachback(text,TERMS);assert.deepEqual(named,['level-cerebellar'],text);
  }
  // A separate mention of the thalamus elsewhere is still counted.
  assert.deepEqual(matchTeachback('the thalamus and the dentato-rubro-thalamic tract',TERMS).named,['thalamus-medial','level-cerebellar']);
});
test('rule 2: the sub- prefix is joined, so subcortical never reads as a cortical synonym',()=>{
  const cortical=[{step:9,terms:[{id:'level-cortical',label:'Cortical level',en:['cortical level','cortical'],pt:['nível cortical','cortical']}]}];
  for(const text of ['a sub-cortical level','a subcortical level','a sub cortical level','um nível sub-cortical','the sub-cortex'])
    assert.deepEqual(matchTeachback(text,cortical).named,[],text);
  assert.deepEqual(matchTeachback('a cortical level',cortical).named,['level-cortical']);
  assert.equal(normalizeTranscript('Sub-cortical, sub cortex, sub-thalamic'),'subcortical subcortex subthalamic');
});
test('only motor-cst carries teach-back terms, equal to the reviewed fixture; other takeaways keep {step,text}',()=>{
  for(const [id,guide] of Object.entries(TEACHING_GUIDES))if(id!=='motor-cst')for(const point of guide.takeaways)
    assert.deepEqual(Object.keys(point).sort(),['step','text'],id);
  const live=TEACHING_GUIDES['motor-cst'].takeaways.filter(p=>p.terms).map(p=>({step:p.step,terms:p.terms}));
  assert.deepEqual(live,JSON.parse(JSON.stringify(TERMS)));
  assert.equal(teachbackTerms(TEACHING_GUIDES['motor-cst'].takeaways).length,10);
  assert.deepEqual(matchTeachback('anything at all',TEACHING_GUIDES['motor-cst'].takeaways).named,[]);
  assert.equal(teachbackTerms(TERMS).length,10);
});
