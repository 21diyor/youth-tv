import test from 'node:test'
import assert from 'node:assert/strict'
import {loginEmail} from '../src/auth/loginIdentifier.ts'
test('dashboard login resolves to separate identities on viewer and editor pages',()=>{
 assert.equal(loginEmail(' dashboard ',true),'dashboard-editor@youth-tv.invalid')
 assert.equal(loginEmail('dashboard'),'dashboard@youth-tv.invalid')
 assert.equal(loginEmail('admin@example.com',true),'admin@example.com')
 assert.equal(loginEmail('hr2026'),'hr2026@youth-tv.invalid')
})
