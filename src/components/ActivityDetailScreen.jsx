import { useState } from 'react'
import { T, formatDate, formatTijd, buildGroupWhatsAppMessage, downloadICS } from '../lib/helpers.js'
import { updateActivity, deleteActivity, confirmActivity } from '../lib/supabase.js'
import { StatusBadge, MemberChip, SectionTitle, Divider, Lbl, Inp, Btn } from './UI.jsx'

export default function ActivityDetailScreen({ activity, members, currentMember, onBack, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(activity.title)
  const [location, setLocation] = useState(activity.location)
  const [bestDate, setBestDate] = useState(activity.best_date || '')
  const [startTime, setStartTime] = useState(activity.start_time || '')
  const [endTime, setEndTime] = useState(activity.end_time || '')
  const [timeError, setTimeError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const confirmIds = activity.confirmations?.map(c => c.member_id) || []
  const alreadyConfirmed = confirmIds.includes(currentMember?.id)
  const canEdit = activity.status !== 'gepland'

  const appBaseUrl = window.location.origin

  const handleSaveEdit = async () => {
    // Fix 3: tijdvalidatie
    if (startTime && endTime && endTime <= startTime) {
      setTimeError('Eindtijd moet na begintijd liggen')
      return
    }
    setTimeError('')
    setSaving(true)
    try {
      const updated = await updateActivity(activity.id, {
        title,
        location,
        best_date: bestDate,
        start_time: startTime,
        end_time: endTime || null,
      })
      onUpdated(updated)
      setEditing(false)
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    }
    setSaving(false)
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmActivity(activity.id, currentMember.id, activity.group_id)
      setConfirmed(true)
      onUpdated({ ...activity, confirmations: [...(activity.confirmations || []), { member_id: currentMember.id }] })
    } catch (e) {
      alert('Bevestigen mislukt: ' + e.message)
    }
    setConfirming(false)
  }

  const handleDelete = async () => {
    try {
      await deleteActivity(activity.id)
      onDeleted(activity.id)
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  if (confirmed) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, background: T.bg }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8 }}>Bevestigd!</div>
      <div style={{ fontSize: 14, color: T.textMuted, textAlign: 'center', marginBottom: 28 }}>
        Zodra iedereen bevestigt is het definitief gepland.
      </div>
      <Btn onClick={onBack} small>← Terug</Btn>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      {/* Detail */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <StatusBadge status={activity.status} />
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: T.textMid, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", minHeight: 36 }}>
                ✏ Bewerken
              </button>
            )}
          </div>

          {editing ? (
            <>
              <Lbl>Titel</Lbl>
              <Inp value={title} onChange={e => setTitle(e.target.value)} placeholder="Activiteit" />
              <Lbl>Locatie</Lbl>
              <Inp value={location} onChange={e => setLocation(e.target.value)} placeholder="Locatie" />
              <Lbl>Datum</Lbl>
              <input
                type="date"
                value={bestDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBestDate(e.target.value)}
                style={{ width: '100%', background: T.surfaceAlt, border: `1px solid ${T.borderDark}`, borderRadius: 6, padding: '11px 13px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', marginBottom: 10, colorScheme: 'light', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: timeError ? 4 : 10 }}>
                <div>
                  <Lbl>Begintijd</Lbl>
                  <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); setTimeError('') }}
                    style={{ width: 110, background: T.surfaceAlt, border: `1px solid ${timeError ? T.red : T.borderDark}`, borderRadius: 6, padding: '8px 10px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', colorScheme: 'light' }} />
                </div>
                <div style={{ paddingBottom: 10, color: T.textMuted, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>–</div>
                <div>
                  <Lbl>Eindtijd</Lbl>
                  <input type="time" value={endTime} onChange={e => { setEndTime(e.target.value); setTimeError('') }}
                    style={{ width: 110, background: T.surfaceAlt, border: `1px solid ${timeError ? T.red : T.borderDark}`, borderRadius: 6, padding: '8px 10px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', colorScheme: 'light' }} />
                </div>
                <div style={{ paddingBottom: 9, fontSize: 11, color: T.textMuted, flexShrink: 0 }}>optioneel</div>
              </div>
              {timeError && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, marginBottom: 10 }}>{timeError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={handleSaveEdit} disabled={saving || !bestDate} small>{saving ? 'Opslaan…' : 'Opslaan'}</Btn>
                <Btn variant="ghost" onClick={() => { setTitle(activity.title); setLocation(activity.location); setBestDate(activity.best_date || ''); setStartTime(activity.start_time || ''); setEndTime(activity.end_time || ''); setTimeError(''); setEditing(false) }} small>Annuleren</Btn>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 10, lineHeight: 1.2 }}>{activity.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 13, color: T.textMid }}>📅 {formatDate(activity.best_date)}</div>
                {activity.start_time && <div style={{ fontSize: 13, color: T.textMid }}>🕐 {formatTijd(activity.start_time, activity.end_time)}</div>}
                <div style={{ fontSize: 13, color: T.textMid }}>📍 {activity.location}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bevestigingen */}
      <SectionTitle>Bevestigingen</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {members.map((m, i) => {
          const done = confirmIds.includes(m.id)
          return (
            <div key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name}{m.id === currentMember?.id ? ' (jij)' : ''}</span>
                <StatusBadge status={done ? 'gepland' : 'bevestigen'} />
              </div>
              {i < members.length - 1 && <Divider />}
            </div>
          )
        })}
      </div>

      {/* Jouw bevestiging */}
      {!alreadyConfirmed && activity.status !== 'gepland' && (
        <>
          <SectionTitle>Jouw bevestiging</SectionTitle>
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
            <Btn disabled={confirming} onClick={handleConfirm}>
              {confirming ? 'Bevestigen…' : '✓ Ik ben erbij!'}
            </Btn>
          </div>
        </>
      )}

      {alreadyConfirmed && activity.status !== 'gepland' && (
        <div style={{ margin: '12px 16px', background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>✓ Jij hebt al bevestigd</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
            Wachten op {members.filter(m => !confirmIds.includes(m.id)).map(m => m.name).join(', ')}
          </div>
        </div>
      )}

      {/* Toevoegen aan agenda */}
      {(alreadyConfirmed || activity.status === 'gepland') && (
        <>
          <SectionTitle>Agenda</SectionTitle>
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
            <button
              onClick={() => downloadICS(activity)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14, fontWeight: 700, color: T.text, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              📅 Toevoegen aan agenda
            </button>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8, textAlign: 'center' }}>
              Werkt met iPhone Agenda, Google Calendar en Outlook
            </div>
          </div>
        </>
      )}

      {/* WhatsApp */}
      {activity.status !== 'gepland' && (
        <>
          <SectionTitle>Sturen via WhatsApp</SectionTitle>
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Groepsbericht met statusoverzicht:</div>
              <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: T.textMid, lineHeight: 1.7, marginBottom: 10 }}>
                📅 <strong>{activity.title}</strong> — {formatDate(activity.best_date)}{activity.start_time ? `, ${formatTijd(activity.start_time, activity.end_time)}` : ''}<br />
                📍 {activity.location}<br />
                <br />
                {members.map(m => {
                  const done = confirmIds.includes(m.id)
                  return <span key={m.id}>{done ? '✅' : '⏳'} {m.name}<br /></span>
                })}
              </div>
              <a href={buildGroupWhatsAppMessage(activity, members, activity.confirmations || [], appBaseUrl)} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', background: '#25D366', borderRadius: 4, padding: '11px', color: T.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                📲 Stuur naar de groep
              </a>
            </div>
          </div>
        </>
      )}

      {/* Verwijderen */}
      <SectionTitle>Verwijderen</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${T.redBorder}`, borderRadius: 4, color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            🗑 Activiteit verwijderen
          </button>
        ) : (
          <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.red, marginBottom: 4 }}>Weet je het zeker?</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>"{activity.title}" wordt permanent verwijderd voor iedereen.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDelete} style={{ flex: 1, padding: '10px', background: T.red, border: 'none', borderRadius: 4, color: T.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Ja, verwijder</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Annuleren</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 32 }} />
    </div>
  )
}
