import { T } from '../lib/helpers.js'

export const Divider = () => (
  <div style={{ height: 1, background: T.border }} />
)

export const SectionTitle = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.textMuted, padding: '18px 16px 8px', background: T.bg, ...style }}>
    {children}
  </div>
)

export const Inp = ({ value, onChange, placeholder, type = 'text', maxLength }) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
    maxLength={maxLength}
    style={{ width: '100%', background: T.surfaceAlt, border: `1px solid ${T.borderDark}`, borderRadius: 6, padding: '11px 13px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
  />
)

export const Lbl = ({ children }) => (
  <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {children}
  </div>
)

export const Btn = ({ variant = 'primary', disabled, onClick, children, small }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    style={{
      width: small ? 'auto' : '100%',
      padding: small ? '9px 18px' : '13px',
      borderRadius: 4,
      fontFamily: "'Outfit',sans-serif",
      fontSize: small ? 13 : 14,
      fontWeight: 700,
      cursor: 'pointer',
      marginBottom: small ? 0 : 8,
      background: variant === 'primary' ? T.red : variant === 'ghost' ? 'transparent' : T.surfaceAlt,
      color: variant === 'primary' ? T.white : variant === 'ghost' ? T.textMuted : T.text,
      border: variant === 'ghost' ? `1px solid ${T.border}` : 'none',
      opacity: disabled ? 0.35 : 1,
    }}
  >
    {children}
  </button>
)

export const MemberChip = ({ active, warn, children }) => (
  <span style={{
    fontSize: 11, padding: '2px 8px', borderRadius: 3, fontWeight: 600,
    background: active ? T.greenBg : warn ? T.amberBg : T.surfaceAlt,
    color: active ? T.green : warn ? T.amber : T.textMuted,
    border: `1px solid ${active ? T.greenBorder : warn ? T.amberBorder : T.border}`,
  }}>
    {children}
  </span>
)

export const StatusBadge = ({ status }) => {
  const map = {
    gepland:    { bg: T.greenBg,    color: T.green,    border: T.greenBorder, label: '✓ gepland'   },
    bevestigen: { bg: T.amberBg,    color: T.amber,    border: T.amberBorder, label: 'bevestigen'  },
    verlopen:   { bg: T.redLight,   color: T.red,      border: T.redBorder,   label: 'verlopen'    },
    actief:     { bg: T.greenBg,    color: T.green,    border: T.greenBorder, label: '✓ actief'    },
    geweest:    { bg: T.surfaceAlt, color: T.textMuted,border: T.border,      label: 'geweest'     },
  }
  const s = map[status] || map.bevestigen
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {s.label}
    </span>
  )
}

export const DayCell = ({ selected, count, total, onClick, children, past }) => {
  const full = count === total && total > 0
  const partial = count > 0 && count < total
  return (
    <div
      onClick={!past ? onClick : undefined}
      style={{
        flex: 1, textAlign: 'center', padding: '7px 1px', borderRadius: 4,
        cursor: past ? 'default' : 'pointer',
        fontSize: 11, fontWeight: selected ? 800 : 400,
        background: selected ? T.red : full ? T.greenBg : partial ? T.amberBg : 'transparent',
        color: selected ? T.white : full ? T.green : partial ? T.amber : past ? '#ccc' : T.textMuted,
        border: `1px solid ${selected ? T.red : full ? T.greenBorder : partial ? T.amberBorder : 'transparent'}`,
        userSelect: 'none',
        opacity: past ? 0.4 : 1,
      }}
    >
      {children}
    </div>
  )
}

export const NOSHeader = ({ onAvatarClick, onHelpClick, currentMember }) => (
  <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 300 }}>
    <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
      <div style={{ background: T.red, borderRadius: 4, padding: '3px 9px', fontWeight: 900, fontSize: 15, color: T.white, letterSpacing: '-0.5px' }}>
        MANNEN
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={onHelpClick} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#ccc', cursor: 'pointer' }}>
          ?
        </div>
        <div onClick={onAvatarClick} style={{ width: 34, height: 34, borderRadius: '50%', background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.white, cursor: 'pointer' }}>
          {currentMember?.name?.[0] || 'M'}
        </div>
      </div>
    </div>
  </div>
)

export const SubHeader = ({ title, subtitle, onBack }) => (
  <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 300 }}>
    <div style={{ padding: '10px 16px 14px' }}>
      <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '8px 16px', color: T.white, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 38 }}>
        ‹ Terug
      </button>
      <div style={{ fontWeight: 800, fontSize: 19, color: T.white, lineHeight: 1.2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{subtitle}</div>}
    </div>
  </div>
)

export const BottomNav = ({ tab, setTab }) => {
  const items = [
    { id: 'home',     icon: '🏠', label: 'Home'    },
    { id: 'wishlist', icon: '🗺️', label: 'Wishlist' },
    { id: 'archief',  icon: '📦', label: 'Archief'  },
  ]
  return (
    <nav style={{ background: T.navBg, borderTop: '1px solid #333', display: 'flex', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {items.map(({ id, icon, label }) => (
        <button key={id} onClick={() => setTab(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0 12px', background: 'none', border: 'none', cursor: 'pointer', color: tab === id ? T.red : '#888', fontSize: 10, fontWeight: tab === id ? 700 : 400, fontFamily: "'Outfit',sans-serif", borderTop: tab === id ? `2px solid ${T.red}` : '2px solid transparent' }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}
