/* ===== UI components — Decision OS ===== */
const { useState, useRef, useEffect, useMemo } = React;

/* ---------- Icons ---------- */
function Ic({ d, size = 16, fill = false, sw = 1.6, ...p }) {
  return (
    <svg {...p} width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((x, i) => <path key={i} d={x} />) : <path d={d} />}
    </svg>
  );
}
const Icons = {
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  sun: ['M12 3v1.5 M12 19.5V21 M5.6 5.6l1 1 M17.4 17.4l1 1 M3 12h1.5 M19.5 12H21 M5.6 18.4l1-1 M17.4 6.6l1-1', 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'],
  calendar: ['M8 2.5v3 M16 2.5v3 M3.5 9.5h17', 'M4 5h16a1.5 1.5 0 0 1 1.5 1.5V20A1.5 1.5 0 0 1 20 21.5H4A1.5 1.5 0 0 1 2.5 20V6.5A1.5 1.5 0 0 1 4 5z'],
  alert: ['M10.6 4 2.5 18a1.6 1.6 0 0 0 1.4 2.4h16.2a1.6 1.6 0 0 0 1.4-2.4L13.4 4a1.6 1.6 0 0 0-2.8 0z', 'M12 9.5v4 M12 17h.01'],
  flag: ['M5 21V4 M5 4h11l-1.5 3.5L16 11H5'],
  clock: ['M12 7v5l3 1.5', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'],
  check: 'M5 12.5 10 17 19 7',
  plus: 'M12 5v14 M5 12h14',
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M14 14h6v6h-6z', 'M4 14h6v6H4z'],
  archive: ['M20.5 8v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8', 'M3 4h18v4H3z', 'M10 12h4'],
  menu: 'M3.5 7h17 M3.5 12h17 M3.5 17h17',
  x: 'M18 6 6 18 M6 6l12 12',
  arrow: 'M5 12h13 M13 6l6 6-6 6',
  layers: ['M12 3 3 8l9 5 9-5-9-5z', 'M3 13l9 5 9-5 M3 18l9 5 9-5'],
  target: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  trash: ['M3.5 6h17 M9 6V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5V6 M18.5 6l-.8 13a1.5 1.5 0 0 1-1.5 1.4H7.8a1.5 1.5 0 0 1-1.5-1.4L5.5 6'],
  bolt: 'M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8z',
  hourglass: 'M6.5 3h11 M6.5 21h11 M8 3c0 3 8 4.5 8 9s-8 6-8 9 M16 3c0 3-8 4.5-8 9s8 6 8 9',
  repeat: ['M17 2l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 22l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  note: ['M4 4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5v15A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5z', 'M8 8h8 M8 12h8 M8 16h5'],
  tag: ['M3 11.5V5a2 2 0 0 1 2-2h6.5a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0L3.6 13a2 2 0 0 1-.6-1.5z', 'M7.5 8.5h.01'],
  chevL: 'M15 6l-6 6 6 6',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
};

/* ---------- Decision card ---------- */
function DecisionCard({ t, onToggle, onOpen, onDragStart, onDragEnd, onDropBefore, dragging, flash, hlId, onHover }) {
  const chips = reasonChips(t);
  const reco = recommendationOf(t);
  const urgent = isUrgentSignal(t);
  const ds = deadlineState(t);
  const cat = catOf(t.category);
  const g = groupOf(t);
  const sub = subProgress(t);
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); onDropBefore(e, t); }}>
      <article
        className={`dcard ${t.done ? 'done' : ''} ${dragging ? 'dragging' : ''} ${flash ? 'flash' : ''}`}
        draggable onDragStart={e => onDragStart(e, t)} onDragEnd={onDragEnd}
        onClick={() => onOpen(t)}
        onMouseEnter={() => onHover && onHover(t.id)} onMouseLeave={() => onHover && onHover(null)}>
        <button className={`dcard-check ${t.done ? 'done' : ''}`} onClick={e => { e.stopPropagation(); onToggle(t.id); }} aria-label="完了にする">
          <Ic d={Icons.check} size={11} sw={2.6} />
        </button>
        <div className="dcard-body">
          <div className="dcard-title">{t.title}</div>
          <div className="dcard-reason">
            {chips.map((c, i) => <span key={i} className={`reason-chip ${c.tone}`}>{c.text}</span>)}
          </div>
          {(t.tags && t.tags.length > 0) && (
            <div className="dcard-tags">
              {t.tags.map(tag => <span key={tag} className="tag-chip" style={{ '--tg': tagColor(tag) }}>{tag}</span>)}
            </div>
          )}
          <div className="dcard-meta">
            <span className="meta-dot" style={{ background: cat.color }} />
            <span className="meta-cat">{cat.name}</span>
            {sub.total > 0 && <span className={`meta-item ${sub.done === sub.total ? 'sub-done' : ''}`}><Ic d={Icons.check} size={11} sw={2.2} />{sub.done}/{sub.total}</span>}
            {t.estMin > 0 && <span className="meta-item"><Ic d={Icons.clock} size={11} />{fmtMinutes(t.estMin)}</span>}
            {t.deadline && <span className="meta-item"><Ic d={Icons.calendar} size={11} />{fmtDate(t.deadline)}</span>}
            {t.repeat && t.repeat !== 'none' && <span className="meta-item"><Ic d={Icons.repeat} size={11} />{repeatLabel(t.repeat)}</span>}
            {t.note && <span className="meta-item meta-note"><Ic d={Icons.note} size={11} /></span>}
          </div>
        </div>
        <div className="dcard-reco">
          <div className="reco-label" style={{ color: urgent ? 'var(--signal-ink)' : GROUPS[g].ink }}>{reco}</div>
          <div className="reco-score tnum">指数 {scoreOf(t)}</div>
        </div>
      </article>
    </div>
  );
}

/* ---------- Profile (local account) switcher ---------- */
function ProfileSwitcher({ profiles, active, setProfile, addProfile, renameProfile, deleteProfile }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const initial = (active.name || '?').trim().charAt(0) || '?';
  const submit = () => { const n = name.trim(); if (!n) return; addProfile(n); setName(''); setAdding(false); setOpen(false); };
  return (
    <div className="profile">
      <button className="profile-btn" onClick={() => setOpen(o => !o)}>
        <span className="profile-avatar">{initial}</span>
        <span className="profile-name">{active.name}</span>
        <Ic d={Icons.chevD} size={15} className="profile-chev" />
      </button>
      {open && (
        <React.Fragment>
          <div className="profile-scrim" onClick={() => { setOpen(false); setAdding(false); }} />
          <div className="profile-pop">
            <div className="pp-label">アカウント</div>
            {profiles.map(p => (
              <div key={p.id} className={`pp-row ${p.id === active.id ? 'on' : ''}`}>
                <button className="pp-pick" onClick={() => { setProfile(p.id); setOpen(false); }}>
                  <span className="profile-avatar sm">{(p.name || '?').trim().charAt(0)}</span>
                  <input className="pp-name" value={p.name} onClick={e => e.stopPropagation()} onChange={e => renameProfile(p.id, e.target.value)} />
                  {p.id === active.id && <Ic d={Icons.check} size={13} sw={2.4} className="pp-check" />}
                </button>
                {p.id !== 'default' && <button className="pp-del" onClick={() => { if (window.confirm(`アカウント「${p.name}」とそのタスクを削除しますか？`)) deleteProfile(p.id); }} aria-label="削除"><Ic d={Icons.trash} size={13} /></button>}
              </div>
            ))}
            {adding ? (
              <div className="pp-add">
                <input className="pp-name" autoFocus placeholder="アカウント名" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
                <button className="btn-add" onClick={submit} disabled={!name.trim()}>追加</button>
              </div>
            ) : (
              <button className="pp-new" onClick={() => setAdding(true)}><Ic d={Icons.plus} size={13} sw={2} />アカウントを追加</button>
            )}
            <div className="pp-hint">データはこの端末のブラウザに保存されます（アカウントごとに分離）。端末間の同期はありません。</div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ tasks, categories, activeCat, setCat, activeFilter, setFilter, view, setView, onManage, onClose, profiles, active, setProfile, addProfile, renameProfile, deleteProfile }) {
  const actv = tasks.filter(t => !t.done);
  const catCount = id => actv.filter(t => t.category === id).length;
  const fCount = f => actv.filter(FILTERS[f].test).length;
  const doneCount = tasks.filter(t => t.done).length;
  const overdue = actv.filter(FILTERS.overdue.test).length;

  const go = (fn) => { fn(); onClose && onClose(); };

  return (
    <aside className="col sidebar">
      <div className="brand">
        <div className="brand-mark"><Ic d={Icons.target} size={17} sw={1.7} /></div>
        <div>
          <div className="brand-name">プライオリティ</div>
          <div className="brand-sub">Decision OS</div>
        </div>
      </div>

      {profiles && <ProfileSwitcher profiles={profiles} active={active} setProfile={setProfile} addProfile={addProfile} renameProfile={renameProfile} deleteProfile={deleteProfile} />}

      <div className="nav-group">
        <div className="nav-label">ビュー</div>
        <button className={`nav-item ${view === 'list' && activeFilter === 'all' && activeCat === 'all' ? 'active' : ''}`} onClick={() => go(() => { setView('list'); setFilter('all'); setCat('all'); })}>
          <Ic d={Icons.inbox} className="ico" />すべてのタスク<span className="count tnum">{actv.length}</span>
        </button>
        <button className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => go(() => setView('calendar'))}>
          <Ic d={Icons.calendar} className="ico" />カレンダー
        </button>
        <button className={`nav-item ${view === 'matrix' ? 'active' : ''}`} onClick={() => go(() => setView('matrix'))}>
          <Ic d={Icons.grid} className="ico" />優先度マトリクス
        </button>
        <button className={`nav-item ${view === 'archive' ? 'active' : ''}`} onClick={() => go(() => setView('archive'))}>
          <Ic d={Icons.archive} className="ico" />完了アーカイブ<span className="count tnum">{doneCount}</span>
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-label">フィルター</div>
        {[['today', Icons.sun], ['week', Icons.calendar], ['overdue', Icons.alert], ['high', Icons.flag], ['loweffort', Icons.bolt]].map(([f, ic]) => (
          <button key={f} className={`nav-item ${view === 'list' && activeFilter === f ? 'active' : ''} ${f === 'overdue' && overdue ? 'urgent' : ''}`}
            onClick={() => go(() => { setView('list'); setFilter(f); setCat('all'); })}>
            <Ic d={ic} className="ico" />{FILTERS[f].name}<span className="count tnum">{fCount(f)}</span>
          </button>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label-row">
          <span className="nav-label">カテゴリ</span>
          <button className="nav-manage" onClick={() => go(onManage)}><Ic d={Icons.plus} size={12} sw={2} />管理</button>
        </div>
        {categories.map(c => (
          <button key={c.id} className={`nav-item ${view === 'list' && activeCat === c.id ? 'active' : ''}`} onClick={() => go(() => { setView('list'); setCat(c.id); })}>
            <span className="nav-cat-dot" style={{ background: c.color }} />{c.name}<span className="count tnum">{catCount(c.id)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ---------- Priority Matrix (quiet analytics) ---------- */
function Matrix({ tasks, hlId, onHover, onOpen }) {
  const [tip, setTip] = useState(null);
  const active = tasks.filter(t => !t.done);
  const cells = {};
  active.forEach(t => { const k = `${t.importance}-${t.urgency}`; (cells[k] = cells[k] || []).push(t); });
  const pos = (t) => {
    const cell = cells[`${t.importance}-${t.urgency}`];
    const idx = cell.indexOf(t), n = cell.length;
    const bx = 8 + (t.urgency - 1) / 4 * 84;
    const by = 8 + (t.importance - 1) / 4 * 84;
    let ox = 0, oy = 0;
    if (n > 1) { const a = (idx / n) * Math.PI * 2; ox = Math.cos(a) * 3.6; oy = Math.sin(a) * 3.6; }
    return { x: Math.max(5, Math.min(95, bx + ox)), y: Math.max(5, Math.min(95, by + oy)) };
  };
  return (
    <div className="matrix-wrap">
      <div className="matrix">
        <div className="matrix-shade" />
        <div className="matrix-gl" style={{ left: '50%', top: 0, bottom: 0, width: 1 }} />
        <div className="matrix-gl" style={{ top: '50%', left: 0, right: 0, height: 1 }} />
        {[25, 75].map(p => <div key={'x' + p} className="matrix-tick" style={{ left: `${p}%`, bottom: 0, height: 5, width: 1 }} />)}
        {[25, 75].map(p => <div key={'y' + p} className="matrix-tick" style={{ bottom: `${p}%`, left: 0, width: 5, height: 1 }} />)}
        <div className="matrix-q" style={{ right: 7, top: 7 }}>まず着手</div>
        <div className="matrix-q" style={{ left: 7, top: 7 }}>計画</div>
        <div className="matrix-q" style={{ right: 7, bottom: 7 }}>すぐ完了</div>
        <div className="matrix-q" style={{ left: 7, bottom: 7 }}>保留</div>
        {active.map(t => {
          const p = pos(t);
          return (
            <div key={t.id}
              className={`matrix-dot ${isUrgentSignal(t) ? 'risk' : ''} ${hlId === t.id ? 'hl' : ''}`}
              style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
              onMouseEnter={() => { onHover && onHover(t.id); setTip({ t, x: p.x, y: p.y }); }}
              onMouseLeave={() => { onHover && onHover(null); setTip(null); }}
              onClick={e => { e.stopPropagation(); onOpen && onOpen(t); }} />
          );
        })}
        {tip && (
          <div className="matrix-tip" style={{ left: `${tip.x}%`, bottom: `${tip.y + 3}%` }}>
            {tip.t.title}
            <div className="t-sub">{recommendationOf(tip.t)}・指数 {scoreOf(tip.t)}</div>
          </div>
        )}
        <div className="matrix-axis-y">重要度</div>
      </div>
      <div className="matrix-axis-x">緊急度</div>
    </div>
  );
}

/* ---------- Calendar (month view) ---------- */
function Calendar({ tasks, onOpen }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(TODAY); d.setDate(1); return d; });
  const [sel, setSel] = useState(TODAY_YMD);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const ymdOf = d => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const byDay = {};
  tasks.filter(t => !t.done && t.deadline).forEach(t => { const k = t.deadline.slice(0, 10); (byDay[k] = byDay[k] || []).push(t); });
  const selList = (byDay[sel] || []).slice().sort((a, b) => scoreOf(b) - scoreOf(a));
  const dayLabel = ymd => {
    if (!ymd) return '';
    if (ymd === TODAY_YMD) return '今日';
    const yd = new Date(TODAY); yd.setDate(yd.getDate() + 1);
    if (ymd === localYmd(yd)) return '明日';
    const d = new Date(ymd);
    return `${d.getMonth() + 1}月${d.getDate()}日 (${'日月火水木金土'[d.getDay()]})`;
  };
  const shiftMonth = n => setCursor(c => { const x = new Date(c); x.setMonth(x.getMonth() + n); return x; });
  return (
    <div className="cal-wrap">
      <div className="cal-head">
        <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="前の月"><Ic d={Icons.chevL} size={16} /></button>
        <span className="cal-month tnum">{year}年 {month + 1}月</span>
        <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="次の月"><Ic d={Icons.chevR} size={16} /></button>
        <button className="cal-today-btn" onClick={() => { const d = new Date(TODAY); d.setDate(1); setCursor(d); setSel(TODAY_YMD); }}>今日</button>
      </div>
      <div className="cal-grid cal-dow">
        {['日', '月', '火', '水', '木', '金', '土'].map((w, i) => <div key={i} className={`cal-dow-c ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>{w}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={'b' + i} className="cal-cell empty" />;
          const k = ymdOf(d);
          const items = byDay[k] || [];
          const dow = new Date(year, month, d).getDay();
          return (
            <button key={k} className={`cal-cell ${k === TODAY_YMD ? 'today' : ''} ${k === sel ? 'sel' : ''}`} onClick={() => setSel(k)}>
              <span className={`cal-d tnum ${dow === 0 ? 'sun' : ''} ${dow === 6 ? 'sat' : ''}`}>{d}</span>
              {items.length > 0 && (
                <span className="cal-dots">
                  {items.slice(0, 3).map(t => <span key={t.id} className="cal-dot" style={{ background: GROUPS[groupOf(t)].color }} />)}
                  {items.length > 3 && <span className="cal-more tnum">+{items.length - 3}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="cal-day-list">
        <div className="cal-day-head"><span className="cal-day-label">{dayLabel(sel)}</span><span className="meta tnum">{selList.length}件</span></div>
        {selList.length === 0 ? <div className="cos-empty">この日に締切のタスクはありません。</div> :
          selList.map(t => (
            <div key={t.id} className="cos-row" onClick={() => onOpen(t)}>
              <span className="cos-row-mark" style={{ background: GROUPS[groupOf(t)].color }} />
              <div className="cos-row-body">
                <div className="cos-row-title">{t.title}</div>
                <div className="cos-row-sub">{catOf(t.category).name}・{recommendationOf(t)}・指数 {scoreOf(t)}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

Object.assign(window, { Ic, Icons, DecisionCard, Sidebar, Matrix, Calendar, ProfileSwitcher });
