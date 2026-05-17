import { useState, useEffect } from 'react'
import { T } from './lib/helpers.js'
import {
  supabase,
  getMembers, getAvailabilityIncludingExpired, getActivities, getWishlist,
  archiveExpiredActivities, subscribeToActivities, subscribeToAvailability,
} from './lib/supabase.js'
import { NOSHeader, SubHeader, BottomNav, SidebarNav } from './components/UI.jsx'
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

      {/* Desktop layout — sidebar + content */}
      <div className="app-shell">

        {/* Sidebar — alleen desktop */}
        {!subScreen && !showHelp && (
          <div className="sidebar-wrapper">
            <SidebarNav
              tab={tab}
              setTab={setTab}
              currentMember={currentMember}
              onAvatarClick={() => setShowAvail(true)}
              onHelpClick={() => setShowHelp(true)}
            />
          </div>
        )}

        {/* Main content */}
        <div className="main-content">

          {/* Header — mobiel + subschermen */}
          <div className="mobile-header">
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
          </div>

          {/* Desktop subheader */}
          {(subScreen || showHelp) && (
            <div className="desktop-subheader">
              <div style={{ background: T.navBg, borderBottom: '1px solid #2a2a2a', padding: '16px 24px' }}>
                <button onClick={showHelp ? () => setShowHelp(false) : goBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '7px 14px', color: T.white, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ‹ Terug
                </button>
                <div style={{ fontWeight: 800, fontSize: 20, color: T.white }}>
                  {showHelp ? 'Hoe werkt het?' : subTitle}
                </div>
              </div>
            </div>
          )}

          {/* Screens */}
          {showHelp ? <HelpScreen /> : (
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

          {/* Bottom nav — alleen mobiel, alleen hoofdschermen */}
          {!subScreen && !showHelp && (
            <div className="mobile-nav">
              <BottomNav tab={tab} setTab={setTab} />
            </div>
          )}
        </div>
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

  /* App shell — responsive */
  .app-shell {
    display: flex;
    min-height: 100vh;
    background: #f4f4f2;
    font-family: 'Outfit', sans-serif;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
    overflow: hidden;
  }

  /* Mobiel: sidebar verborgen, bottom nav zichtbaar */
  .sidebar-wrapper { display: none; }
  .mobile-header { display: flex; flex-direction: column; }
  .mobile-nav { display: block; }
  .desktop-subheader { display: none; }

  /* Stats blokken */
  .stats-mobile { display: flex; }
  .desktop-stats { display: none !important; }

  /* Desktop (≥768px): sidebar zichtbaar, bottom nav verborgen */
  @media (min-width: 768px) {
    body { background: #1a1a1a; }

    .app-shell {
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }

    .sidebar-wrapper { display: flex; }
    .mobile-header { display: none; }
    .mobile-nav { display: none; }
    .desktop-subheader { display: block; }

    .main-content {
      background: #f4f4f2;
      overflow-y: auto;
      height: 100vh;
    }

    .stats-mobile { display: none !important; }
    .desktop-stats { display: flex !important; }
  }
`
