import { useState, useEffect } from 'react'
import { T } from './lib/helpers.js'
import {
  supabase,
  getMembers,
  getGroupsForMember, getGroupWithMembers,
  getAvailabilityIncludingExpired,
  getActivitiesForGroup, getWishlistForGroup,
  archiveExpiredActivities,
  subscribeToActivities, subscribeToAvailability,
  validateAndJoinViaToken,
} from './lib/supabase.js'
import { NOSHeader, SubHeader, BottomNav, SidebarNav } from './components/UI.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import RegisterScreen from './components/RegisterScreen.jsx'
import DashboardScreen from './components/DashboardScreen.jsx'
import ProfielScreen from './components/ProfielScreen.jsx'
import GroupBeheerScreen from './components/GroupBeheerScreen.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import AvailabilityScreen from './components/AvailabilityScreen.jsx'
import ActivityDetailScreen from './components/ActivityDetailScreen.jsx'
import NewActivityScreen from './components/NewActivityScreen.jsx'
import WishlistScreen from './components/WishlistScreen.jsx'
import AdminScreen from './components/AdminScreen.jsx'
import { ArchiefScreen, HelpScreen } from './components/OtherScreens.jsx'

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [appState, setAppState] = useState('loading') // loading | login | register | app | admin
  const [currentMember, setCurrentMember] = useState(null)

  // ── Multi-groep ───────────────────────────────────────────────────────────
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])

  // ── Data ──────────────────────────────────────────────────────────────────
  const [availability, setAvailability] = useState([])
  const [activities, setActivities] = useState([])
  const [wishlist, setWishlist] = useState([])

  // ── Navigation ────────────────────────────────────────────────────────────
  const [view, setView] = useState('dashboard') // dashboard | group | profiel | beheer | admin
  const [tab, setTab] = useState('home')
  const [activeActivity, setActiveActivity] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [showAvail, setShowAvail] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showBeheer, setShowBeheer] = useState(false)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check voor admin route
    if (window.location.pathname === '/admin') {
      setAppState('admin')
      return
    }

    // Check voor invite token in URL
    const pathParts = window.location.pathname.split('/')
    if (pathParts[1] === 'join' && pathParts[2]) {
      localStorage.setItem('wanneer_pending_token', pathParts[2])
    }

    // Check of al ingelogd
    const savedId = localStorage.getItem('wanneer_member_id')
    const savedName = localStorage.getItem('wanneer_member_name')
    if (savedId && savedName) {
      setCurrentMember({ id: savedId, name: savedName })
      setAppState('app')
    } else {
      setAppState('login')
    }
  }, [])

  // ── Data laden na login ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentMember || appState !== 'app') return
    initApp()
  }, [currentMember, appState])

  async function initApp() {
    await Promise.all([loadGroups(), loadAvailability()])

    // Check voor pending invite token
    const pendingToken = localStorage.getItem('wanneer_pending_token')
    if (pendingToken) {
      try {
        await validateAndJoinViaToken(pendingToken, currentMember.id)
        localStorage.removeItem('wanneer_pending_token')
        window.history.replaceState({}, '', '/')
        await loadGroups()
      } catch (e) {
        console.error('Token join failed:', e.message)
        localStorage.removeItem('wanneer_pending_token')
      }
    }
  }

  async function loadGroups() {
    try {
      const data = await getGroupsForMember(currentMember.id)
      // Laad leden per groep
      const groupsWithMembers = await Promise.all(
        data.map(async g => {
          const members = await getGroupWithMembers(g.id)
          return { ...g, leden: members, memberIds: members.map(m => m.id) }
        })
      )
      setGroups(groupsWithMembers)
      // Als er maar één groep is, die meteen openen
      if (groupsWithMembers.length === 1 && !activeGroup) {
        await openGroup(groupsWithMembers[0])
      }
    } catch (e) { console.error(e) }
  }

  async function loadAvailability() {
    try {
      const data = await getAvailabilityIncludingExpired()
      setAvailability(data)
    } catch (e) { console.error(e) }
  }

  async function openGroup(group) {
    setActiveGroup(group)
    setView('group')
    setTab('home')
    await Promise.all([
      loadActivities(group.id),
      loadWishlist(group.id),
      loadGroupMembers(group.id),
    ])
    await archiveExpiredActivities(group.id)

    // Realtime
    const actSub = subscribeToActivities(group.id, () => loadActivities(group.id))
    const avSub = subscribeToAvailability(() => loadAvailability())
    return () => {
      supabase.removeChannel(actSub)
      supabase.removeChannel(avSub)
    }
  }

  async function loadActivities(groupId) {
    try {
      const data = await getActivitiesForGroup(groupId || activeGroup?.id)
      setActivities(data)
    } catch (e) { console.error(e) }
  }

  async function loadWishlist(groupId) {
    try {
      const data = await getWishlistForGroup(groupId || activeGroup?.id)
      setWishlist(data)
    } catch (e) { console.error(e) }
  }

  async function loadGroupMembers(groupId) {
    try {
      const data = await getGroupWithMembers(groupId || activeGroup?.id)
      setGroupMembers(data)
    } catch (e) { console.error(e) }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = (member) => {
    setCurrentMember(member)
    setAppState('app')
  }

  const handleLogout = () => {
    localStorage.removeItem('wanneer_member_id')
    localStorage.removeItem('wanneer_member_name')
    setCurrentMember(null)
    setAppState('login')
    setGroups([])
    setActiveGroup(null)
    setActivities([])
    setWishlist([])
  }

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

  const goBackToGroup = () => {
    setActiveActivity(null)
    setShowNew(false)
    setShowAvail(false)
    setShowHelp(false)
    setShowBeheer(false)
  }

  const goBackToDashboard = () => {
    setView('dashboard')
    setActiveGroup(null)
    setActivities([])
    setWishlist([])
    goBackToGroup()
  }

  // ── Admin route ───────────────────────────────────────────────────────────
  if (appState === 'admin') return (
    <>
      <style>{globalStyles}</style>
      <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Outfit',sans-serif", color: T.text, display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div style={{ padding: '10px 16px 14px' }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: T.white }}>App beheer</div>
          </div>
        </div>
        <AdminScreen />
      </div>
    </>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (appState === 'loading') return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: T.accent, borderRadius: 8, padding: '6px 16px', fontWeight: 900, fontSize: 22, color: T.white, letterSpacing: '-0.5px' }}>wanneer</div>
    </div>
  )

  // ── Login / Register ──────────────────────────────────────────────────────
  if (appState === 'login') return (
    <>
      <style>{globalStyles}</style>
      <LoginScreen onLogin={handleLogin} onRegister={() => setAppState('register')} />
    </>
  )

  if (appState === 'register') return (
    <>
      <style>{globalStyles}</style>
      <RegisterScreen
        onDone={(member, group) => { handleLogin(member); if (group) openGroup(group) }}
        onBack={() => setAppState('login')}
        inviteToken={localStorage.getItem('wanneer_pending_token')}
      />
    </>
  )

  // ── Subscreen titles ──────────────────────────────────────────────────────
  const subScreen = activeActivity || showNew || showAvail || showBeheer
  const subTitle = activeActivity ? activeActivity.title
    : showNew ? 'Activiteit plannen'
    : showBeheer ? `${activeGroup?.naam} — beheer`
    : 'Mijn beschikbaarheid'

  // Bepaal of we in een groep-context zitten (sidebar tonen op desktop)
  const inGroup = view === 'group'

  // ── App ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>

      <div className="app-shell">

        {/* Sidebar — alleen desktop, alleen in groepscontext */}
        {inGroup && (
          <div className="sidebar-wrapper">
            <SidebarNav
              tab={tab}
              setTab={setTab}
              currentMember={currentMember}
              onAvatarClick={() => setShowAvail(true)}
              onHelpClick={() => setShowHelp(true)}
              onBack={goBackToDashboard}
              groupNaam={activeGroup?.naam}
            />
          </div>
        )}

        <div className="main-content">

          {/* Eén header — mobile toont altijd, desktop alleen bij niet-subschermen */}
          {showHelp ? (
            /* Help header — altijd zichtbaar */
            <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 300 }}>
              <div style={{ padding: '10px 16px 14px' }}>
                <button onClick={() => setShowHelp(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '8px 16px', color: T.white, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 38 }}>‹ Terug</button>
                <div style={{ fontWeight: 800, fontSize: 19, color: T.white }}>Hoe werkt het?</div>
              </div>
            </div>
          ) : subScreen ? (
            /* Subscherm header — altijd zichtbaar, één keer */
            <SubHeader title={subTitle} onBack={goBackToGroup} />
          ) : view === 'profiel' ? (
            /* Profiel header */
            <SubHeader title="Mijn profiel" onBack={() => setView('dashboard')} />
          ) : view === 'dashboard' ? (
            /* Dashboard — eigen header in DashboardScreen zelf */
            null
          ) : (
            /* Groep home/wishlist/archief — mobile header, op desktop verborgen via CSS */
            <div className="mobile-header">
              <NOSHeader
                onAvatarClick={() => setShowAvail(true)}
                onHelpClick={() => setShowHelp(true)}
                currentMember={currentMember}
                groupNaam={activeGroup?.naam}
                onBack={goBackToDashboard}
              />
            </div>
          )}

          {/* Screens */}
          {showHelp ? <HelpScreen /> : (
            view === 'dashboard' ? (
              <DashboardScreen
                groups={groups}
                availability={availability}
                activities={activities}
                currentMember={currentMember}
                onOpenGroup={openGroup}
                onNewGroup={() => setAppState('register')}
                onOpenAvailability={() => setShowAvail(true)}
                onProfiel={() => setView('profiel')}
              />
            ) : view === 'profiel' ? (
              <ProfielScreen
                currentMember={currentMember}
                groups={groups}
                onLogout={handleLogout}
              />
            ) : subScreen ? (
              activeActivity ? (
                <ActivityDetailScreen
                  activity={activeActivity}
                  members={groupMembers}
                  currentMember={currentMember}
                  onBack={goBackToGroup}
                  onUpdated={handleActivityUpdated}
                  onDeleted={handleActivityDeleted}
                />
              ) : showNew ? (
                <NewActivityScreen
                  availability={availability}
                  members={groupMembers}
                  wishlist={wishlist}
                  currentMember={currentMember}
                  groupId={activeGroup?.id}
                  onCreated={handleActivityCreated}
                  onBack={goBackToGroup}
                />
              ) : showBeheer ? (
                <GroupBeheerScreen
                  group={activeGroup}
                  members={groupMembers}
                  currentMember={currentMember}
                  onBack={goBackToGroup}
                  onGroupDeleted={goBackToDashboard}
                  onGroupUpdated={() => { loadGroups(); loadGroupMembers() }}
                />
              ) : (
                <AvailabilityScreen
                  availability={availability}
                  members={groupMembers}
                  currentMember={currentMember}
                  onSaved={() => { loadAvailability(); setShowAvail(false) }}
                />
              )
            ) : tab === 'home' ? (
              <HomeScreen
                activities={activities.filter(a => a.status !== 'geweest')}
                availability={availability}
                members={groupMembers}
                currentMember={currentMember}
                onOpenActivity={setActiveActivity}
                onOpenAvailability={() => setShowAvail(true)}
                onNewActivity={() => setShowNew(true)}
                onOpenBeheer={() => setShowBeheer(true)}
              />
            ) : tab === 'wishlist' ? (
              <WishlistScreen
                wishlist={wishlist}
                members={groupMembers}
                currentMember={currentMember}
                groupId={activeGroup?.id}
                onUpdated={() => loadWishlist()}
              />
            ) : (
              <ArchiefScreen
                activities={activities}
                onOpenActivity={setActiveActivity}
              />
            )
          )}

          {/* Bottom nav — mobiel, alleen in groepsview */}
          {!subScreen && !showHelp && view === 'group' && (
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

  .sidebar-wrapper { display: none; }
  .mobile-header { display: flex; flex-direction: column; }
  .mobile-nav { display: block; }
  .stats-mobile { display: flex; }
  .desktop-stats { display: none !important; }

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

    .main-content {
      background: #f4f4f2;
      overflow-y: auto;
      height: 100vh;
    }

    .stats-mobile { display: none !important; }
    .desktop-stats { display: flex !important; }
  }
`
