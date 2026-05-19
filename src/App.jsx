import { useState, useEffect, useRef } from 'react'
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
import GroupSwitcher from './components/GroupSwitcher.jsx'
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
  const [view, setView] = useState('group') // group | profiel | beheer | admin
  const [tab, setTab] = useState('home')
  const [activeActivity, setActiveActivity] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [initialActivityDate, setInitialActivityDate] = useState(null)
  const [showAvail, setShowAvail] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showBeheer, setShowBeheer] = useState(false)

  // ── Realtime subscriptions ────────────────────────────────────────────────
  const subsRef = useRef([])

  function clearSubs() {
    subsRef.current.forEach(ch => supabase.removeChannel(ch))
    subsRef.current = []
  }

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

    // Ververs beschikbaarheid wanneer de tab weer actief wordt
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadAvailability()
    }
    document.addEventListener('visibilitychange', onVisible)

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
      const groupsWithData = await Promise.all(
        data.map(async g => {
          const members = await getGroupWithMembers(g.id)
          const activities = await getActivitiesForGroup(g.id)
          return { ...g, leden: members, memberIds: members.map(m => m.id), activities }
        })
      )
      setGroups(groupsWithData)
      setActivities(groupsWithData.flatMap(g => g.activities))

      if (groupsWithData.length > 0 && !activeGroup) {
        await openGroup(groupsWithData[0], true)
      }
    } catch (e) { console.error(e) }
  }

  async function loadAvailability() {
    try {
      const data = await getAvailabilityIncludingExpired()
      setAvailability(data)
    } catch (e) { console.error(e) }
  }

  async function openGroup(group, resetTab = false) {
    setActiveGroup(group)
    setView('group')
    if (resetTab) setTab('home')
    goBackToGroup()
    await Promise.all([
      loadActivities(group.id),
      loadWishlist(group.id),
      loadGroupMembers(group.id),
    ])
    await archiveExpiredActivities(group.id)

    // Ruim oude subscriptions op en maak nieuwe aan
    clearSubs()
    const actSub = subscribeToActivities(group.id, () => loadActivities(group.id))
    const avSub = subscribeToAvailability(() => loadAvailability())
    subsRef.current = [actSub, avSub]
  }

  async function loadActivities(groupId) {
    try {
      const gId = groupId || activeGroup?.id
      const data = await getActivitiesForGroup(gId)
      setActivities(data)
      setGroups(prev => prev.map(g => g.id === gId ? { ...g, activities: data } : g))
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
    setView('group')
    setActiveActivity(null)
    setShowNew(false)
    setShowAvail(false)
    setShowHelp(false)
    setShowBeheer(false)
    setInitialActivityDate(null)
  }

  const handleGroupDeleted = async () => {
    setActiveGroup(null)
    setActivities([])
    setWishlist([])
    goBackToGroup()
    await loadGroups()
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
        onBack={() => currentMember ? setAppState('app') : setAppState('login')}
        inviteToken={localStorage.getItem('wanneer_pending_token')}
        currentMember={currentMember}
      />
    </>
  )

  // ── Subscreen titles ──────────────────────────────────────────────────────
  const subScreen = activeActivity || showNew || showAvail || showBeheer
  const subTitle = activeActivity ? activeActivity.title
    : showNew ? 'Activiteit plannen'
    : showBeheer ? `${activeGroup?.naam} — beheer`
    : 'Mijn beschikbaarheid'

  const inGroup = view === 'group' || view === 'profiel'

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
              setTab={(id) => { goBackToGroup(); setTab(id) }}
              currentMember={currentMember}
              onAvatarClick={() => setView('profiel')}
              onHelpClick={() => setShowHelp(true)}
            />
          </div>
        )}

        <div className="main-content">

          {/* Header */}
          {showHelp ? (
            <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 300 }}>
              <div style={{ padding: '10px 16px 14px' }}>
                <button onClick={() => setShowHelp(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '8px 16px', color: T.white, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 38 }}>‹ Terug</button>
                <div style={{ fontWeight: 800, fontSize: 19, color: T.white }}>Hoe werkt het?</div>
              </div>
            </div>
          ) : subScreen ? (
            <SubHeader title={subTitle} onBack={goBackToGroup} />
          ) : view === 'profiel' ? (
            <SubHeader title="Mijn profiel" onBack={() => setView('group')} />
          ) : (
            <div className="mobile-header">
              <NOSHeader
                onLogoClick={() => setTab('home')}
                onAvatarClick={() => setView('profiel')}
                onHelpClick={() => setShowHelp(true)}
                currentMember={currentMember}
              />
            </div>
          )}

          {/* GroupSwitcher — statusbalk boven groepsinhoud */}
          {!subScreen && !showHelp && view === 'group' && groups.length > 0 && (
            <GroupSwitcher
              groups={groups}
              availability={availability}
              activeGroup={activeGroup}
              onSwitch={openGroup}
              currentMember={currentMember}
            />
          )}

          {/* Screens */}
          {showHelp ? <HelpScreen /> : (
            view === 'profiel' ? (
              <ProfielScreen
                currentMember={currentMember}
                groups={groups}
                onLogout={handleLogout}
                onOpenGroup={openGroup}
                onNewGroup={() => setAppState('register')}
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
                  activities={activities.filter(a => a.status !== 'geweest')}
                  currentMember={currentMember}
                  groupId={activeGroup?.id}
                  onCreated={handleActivityCreated}
                  onBack={goBackToGroup}
                  initialDate={initialActivityDate}
                />
              ) : showBeheer ? (
                <GroupBeheerScreen
                  group={activeGroup}
                  members={groupMembers}
                  currentMember={currentMember}
                  onBack={goBackToGroup}
                  onGroupDeleted={handleGroupDeleted}
                  onGroupUpdated={() => { loadGroups(); loadGroupMembers() }}
                  onNewGroup={() => setAppState('register')}
                />
              ) : (
                <AvailabilityScreen
                  availability={availability}
                  members={groupMembers}
                  currentMember={currentMember}
                  onSaved={() => { loadAvailability(); setShowAvail(false) }}
                />
              )
            ) : !activeGroup ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, background: T.bg }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.textMuted }}>Nog geen groepen</div>
                <button onClick={() => setAppState('register')} style={{ padding: '12px 24px', background: T.accent, color: T.white, border: 'none', borderRadius: 6, fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  + Groep aanmaken of joinen
                </button>
              </div>
            ) : tab === 'home' ? (
              <HomeScreen
                activities={activities.filter(a => a.status !== 'geweest')}
                availability={availability}
                members={groupMembers}
                currentMember={currentMember}
                onOpenActivity={setActiveActivity}
                onOpenAvailability={() => setShowAvail(true)}
                onNewActivity={() => setShowNew(true)}
                onNewActivityWithDate={(date) => { setInitialActivityDate(date); setShowNew(true) }}
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

          {/* Bottom nav — mobiel, alleen in groeps- en profielview */}
          {!subScreen && !showHelp && inGroup && (
            <div className="mobile-nav">
              <BottomNav tab={tab} setTab={(id) => { goBackToGroup(); setTab(id) }} />
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
  }
`
