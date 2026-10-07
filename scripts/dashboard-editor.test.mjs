import test from 'node:test'
import assert from 'node:assert/strict'
import {emptyReport,moveItem,validateEditorReport} from '../src/dashboard/editorModel.ts'

test('new reports have a valid editable structure and missing values',()=>{
 const r=emptyReport()
 assert.deepEqual(validateEditorReport(r),[])
 assert.equal(r.sections[0].metrics[0].value,null)
 assert.match(r.asOf,/^\d{4}-\d{2}-\d{2}$/)
})
test('reordering preserves data and handles boundaries',()=>{
 const a=[{id:'a'},{id:'b'},{id:'c'}]
 assert.deepEqual(moveItem(a,1,-1),[a[1],a[0],a[2]])
 assert.deepEqual(a.map(x=>x.id),['a','b','c'])
 assert.equal(moveItem(a,0,-1),a)
 assert.equal(moveItem(a,2,1),a)
})
test('validation rejects empty shows, incomplete labels and invalid numbers',()=>{
 const r=emptyReport();r.presentation={showOverview:false};r.sections[0].visible=false
 assert.ok(validateEditorReport(r).length)
 r.sections[0].visible=true;r.sections[0].metrics[0].value=-1
 assert.ok(validateEditorReport(r).length)
 r.sections[0].metrics[0].value=0
 assert.deepEqual(validateEditorReport(r),[])
 r.sections[0].metrics[0].label=''
 assert.ok(validateEditorReport(r).length)
})
