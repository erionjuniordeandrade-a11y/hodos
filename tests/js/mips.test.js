import test from 'node:test';
import assert from 'node:assert/strict';
import {MIPS_TARGET,parseMipsState,mipsQuery,corridorsForState,reflectionText} from '../../viewer/mips_content.js';

test('MIPS links restore allowed display choices and discard unknown inputs',()=>{
  const chosen={phase:'compare',corridor:'B',width:'wide',view:'superior'};
  assert.deepEqual(parseMipsState(mipsQuery(chosen)),chosen);
  assert.deepEqual(parseMipsState('?phase=operate&corridor=C&width=NaN&view=patient'),
    {phase:'orient',corridor:'both',width:'reference',view:'left'});
  assert(!mipsQuery({...chosen,note:'private example'}).includes('private'));
});

test('both illustrative axes end at the same authored target; width changes only radius',()=>{
  const narrow=corridorsForState({phase:'compare',corridor:'both',width:'reference'});
  const wide=corridorsForState({phase:'explain',corridor:'both',width:'wide'});
  assert.equal(narrow.length,2);
  for(let i=0;i<2;i++){
    assert.deepEqual(narrow[i].end,[MIPS_TARGET.x,MIPS_TARGET.y,MIPS_TARGET.z]);
    assert.deepEqual(narrow[i].start,wide[i].start);
    assert.deepEqual(narrow[i].end,wide[i].end);
    assert(wide[i].radiusMm>narrow[i].radiusMm);
  }
  assert.notDeepEqual(narrow[0].start,narrow[1].start);
  assert.deepEqual(corridorsForState({phase:'orient'}),[]);
  assert.deepEqual(corridorsForState({phase:'compare',corridor:'B'}).map(c=>c.id),['B']);
  narrow[0].end[0]=999;
  assert.notEqual(corridorsForState({phase:'compare'})[0].end[0],999);
});

test('reflection export identifies the exercise and preserves user text literally',()=>{
  const note='<script>not markup</script>\nMy uncertainty';
  const text=reflectionText(note,{phase:'explain',corridor:'A',width:'wide',view:'anterior'});
  assert(text.includes(note));
  assert.match(text,/Fictional teaching exercise/);
  assert.match(text,/Corridor display: A/);
  assert.doesNotMatch(text,/safe|score/i);
});
