import assert from 'node:assert/strict'
import { loadEnvFile } from 'node:process'
import { createClient } from '@supabase/supabase-js'

loadEnvFile('.env.local')
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const tables = ['president_content', 'appeals_content', 'employee_content', 'slide_settings', 'schedule_content', 'managers_content', 'birthday_content']
for (const table of tables) {
  const { data, error } = await client.from(table).select('*')
  assert.ifError(error)
  assert.equal(data.length, 1, `${table}: only one visible row`)
  assert.equal(data[0].status, 'published')
  const path = data[0].photo_path ?? data[0].portrait_path ?? data[0].payload?.photoPath
  if (path) {
    const image = await client.storage.from('tv-media').download(path)
    assert.ifError(image.error)
    assert.ok(image.data.size > 0, `${table}: published image downloads`)
  }
  console.log(`PASS ${table}: anonymous published read and image download`)
}
for (const table of ['user_roles', 'audit_log']) {
  const { error } = await client.from(table).select('*')
  assert.equal(error?.code, '42501', `${table}: access denied`)
}
const channel = client.channel('public-tv-verification')
for (const table of tables) {
  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: 'status=eq.published' }, () => {})
}
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime subscription timed out')), 15000)
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve() }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(error ?? new Error(status)) }
    })
  })
  console.log('PASS anonymous Realtime subscription; admin tables protected')
} finally {
  await client.removeChannel(channel)
  await client.realtime.disconnect()
}
// The SDK can retain background timers after disconnect; this is a one-shot check.
process.exit(0)
