import test from 'node:test';
import assert from 'node:assert/strict';
import {BUNDLE_FAMILIES} from '../../viewer/atlas_data.js';
import {BUNDLE_NAMES,SOURCE_NAMES,bundleLabel,bundleAliases} from '../../viewer/atlas_glossary.js';
test('all installed families have names from the atlas glossary',()=>{
  assert.deepEqual(Object.keys(BUNDLE_NAMES).sort(),[...BUNDLE_FAMILIES].sort());
  assert.deepEqual(Object.keys(SOURCE_NAMES).sort(),[...BUNDLE_FAMILIES].sort());
  assert.equal(bundleLabel('RST_L'),'Reticulospinal tract · left');
  assert.equal(bundleLabel('C_FP_R'),'Cingulum, frontal-parietal · right');
  assert.equal(bundleLabel('TR_S_R'),'Superior thalamic radiation · right');
  assert.equal(bundleLabel('SLF3_L'),'Superior longitudinal fasciculus III · left');
  assert.equal(bundleLabel('CST_L'),'Corticospinal tract · left');
  assert.match(bundleAliases('CST_L'),/Cortico Spinal Tract/);
  assert.match(bundleAliases('TR_S_R'),/Thalamic Radiation Superior/);
  assert.equal(bundleLabel('CB_L'),'Cerebellar fibres (CB sample) · left');
  assert.equal(bundleLabel('V'),'Vermis');
  assert.equal(bundleLabel('unknown_R'),'unknown · right');
});
