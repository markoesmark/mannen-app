import { useState, useEffect } from 'react'
import { T } from './lib/helpers.js'
import {
  supabase,
  getMembers, getAvailabilityIncludingExpired, getActivities, getWishlist,
  archiveExpiredActivities, subscribeToActivities, subscribeToAvailability,
} from './lib/supabase.js'
import { NOSHeader, SubHeader, BottomNav } from './components/UI.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import AvailabilityScreen from './components/AvailabilityScreen.jsx'
import ActivityDetailScreen from './components/ActivityDetailScreen.jsx'
import NewActivityScreen from './components/NewActivityScreen.jsx'
import WishlistScreen from './components/WishlistScreen.jsx'
import { ArchiefScreen, HelpScreen } from './components/OtherScreens.jsx'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [currentMember, setCurrentMember] = useState(null)
  const [members, setMembers] = useState([])
  const [availability, setAvailability] = useState([])
  const [activities, setActivities] = useState([])
  const [wishlist, setWishlist] = useState([])

  const [tab, setTab] = useState('home')
  const [activeActivity, setActiveActivity] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [showAvail, setShowAvail] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const membersData = await getMembers()
      setMembers(membersData)

      // Check of al ingelogd
      const savedId = localStorage.getItem('mannen_member_id')
      const savedName = localStorage.getItem('mannen_member_name')
      if (savedId && savedName) {
        const member = membersData.find(m => m.id === savedId)
        if (member) setCurrentMember(member)
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Data laden na login ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentMember) return
    loadData()

    // Realtime updates
    const actSub = subscribeToActivities(loadActivities)
    const avSub = subscribeToAvailability(loadAvailability)

    return () => {
      supabase.removeChannel(actSub)
      supabase.removeChannel(avSub)
    }
  }, [currentMember])

  async function loadData() {
    await archiveExpiredActivities()
    await Promise.all([loadAvailability(), loadActivities(), loadWishlist()])
  }

  async function loadAvailability() {
    const data = await getAvailabilityIncludingExpired()
    setAvailability(data)
  }

  async function loadActivities() {
    const data = await getActivities()
    setActivities(data)
  }

  async function loadWishlist() {
    const data = await getWishlist()
    setWishlist(data)
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const goBack = () => {
    setActiveActivity(null)
    setShowNew(false)
    setShowAvail(false)
    setShowHelp(false)
  }

  const subScreen = activeActivity || showNew || showAvail

  const subTitle = activeActivity ? activeActivity.title
    : showNew ? 'Activiteit plannen'
    : 'Mijn beschikbaarheid'

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleActivityUpdated = (updated) => {
    setActivities(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
    if (activeActivity?.id === updated.id) setActiveActivity(prev => ({ ...prev, ...updated }))
  }

  const handleActivityDeleted = (id) => {
    setActivities(prev => prev.filter(a => a.id !== id))
    setActiveActivity(null)
  }

  const handleActivityCreated = () => {
    loadActivities()
    setShowNew(false)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: T.red, borderRadius: 8, padding: '6px 16px', fontWeight: 900, fontSize: 22, color: T.white, letterSpacing: '-0.5px' }}>
        MANNEN
      </div>
    </div>
  )

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!currentMember) return (
    <>
      <style>{globalStyles}</style>
      <LoginScreen members={members} onLogin={m => { setCurrentMember(m); }} />
    </>
  )

  // ── App ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Outfit',sans-serif", color: T.text, display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto' }}>

        {/* Header */}
        {showHelp ? (
          <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 300 }}>
            <div style={{ padding: '10px 16px 14px' }}>
              <button onClick={() => setShowHelp(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '8px 16px', color: T.white, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 38 }}>
                ‹ Terug
              </button>
              <div style={{ fontWeight: 800, fontSize: 19, color: T.white }}>Hoe werkt het?</div>
            </div>
          </div>
        ) : subScreen ? (
          <SubHeader title={subTitle} onBack={goBack} />
        ) : (
          <NOSHeader
            onAvatarClick={() => setShowAvail(true)}
            onHelpClick={() => setShowHelp(true)}
            currentMember={currentMember}
          />
        )}

        {/* Help overlay */}
        {showHelp && <HelpScreen />}

        {/* Screens */}
        {!showHelp && (
          activeActivity ? (
            <ActivityDetailScreen
              activity={activeActivity}
              members={members}
              currentMember={currentMember}
              onBack={goBack}
              onUpdated={handleActivityUpdated}
              onDeleted={handleActivityDeleted}
            />
          ) : showNew ? (
            <NewActivityScreen
              availability={availability}
              members={members}
              wishlist={wishlist}
              currentMember={currentMember}
              onCreated={handleActivityCreated}
              onBack={goBack}
            />
          ) : showAvail ? (
            <AvailabilityScreen
              availability={availability}
              members={members}
              currentMember={currentMember}
              onSaved={() => { loadAvailability(); setShowAvail(false) }}
            />
          ) : tab === 'home' ? (
            <HomeScreen
              activities={activities.filter(a => a.status !== 'geweest')}
              availability={availability}
              members={members}
              currentMember={currentMember}
              onOpenActivity={setActiveActivity}
              onOpenAvailability={() => setShowAvail(true)}
              onNewActivity={() => setShowNew(true)}
            />
          ) : tab === 'wishlist' ? (
            <WishlistScreen
              wishlist={wishlist}
              members={members}
              currentMember={currentMember}
              onUpdated={loadWishlist}
            />
          ) : (
            <ArchiefScreen
              activities={activities}
              onOpenActivity={setActiveActivity}
            />
          )
        )}

        {/* Nav */}
        {!subScreen && !showHelp && <BottomNav tab={tab} setTab={setTab} />}
      </div>
    </>
  )
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1a1a1a; }
  ::-webkit-scrollbar { display: none; }
  input::placeholder { color: #888; }
  button:disabled { opacity: 0.35; cursor: not-allowed !important; }
`
