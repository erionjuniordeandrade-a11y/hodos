import test from 'node:test';
import assert from 'node:assert/strict';
import {BUNDLE_FAMILIES} from '../../viewer/atlas_data.js';
import {BUNDLE_NAMES,bundleLabel} from '../../viewer/atlas_glossary.js';
test('all installed families have names from the atlas glossary',()=>{
  assert.deepEqual(Object.keys(BUNDLE_NAMES).sort(),[...BUNDLE_FAMILIES].sort());
  assert.equal(bundleLabel('RST_L'),'Reticulospinal Tract · left');
  assert.equal(bundleLabel('C_FP_R'),'Cingulum Frontal Parietal · right');
  assert.equal(bundleLabel('TR_S_R'),'Thalamic Radiation Superior · right');
  assert.equal(bundleLabel('CB_L'),'Cerebellum · left');
  assert.equal(bundleLabel('V'),'Vermis');
  assert.equal(bundleLabel('unknown_R'),'unknown · right');
});
