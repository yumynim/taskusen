/* ===== UI components ===== */
const { useState, useRef, useEffect, useMemo } = React;

/* ---------- Icons (inline SVG, 1.6 stroke) ---------- */
function Ic({ d, size = 16, fill = false, sw = 1.7, ...p }) {
  return (
    <svg {...p} width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((x, i) => <path key={i} d={x} />) : <path d={d} />}
    </svg>
  );
}
const Icons = {
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  sun: ['M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  calendar: ['M8 2v4 M16 2v4 M3 10h18', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  alert: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 9v4 M12 17h.01'],
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-1-.7-1.8-1.3-2.7-.8-1.2-1.2-2.4-1.2-2.4s-2 1.5-2 3.6c0 .6.2 1 .5 1.5zM12 2s4 3 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5.5-2.5',
  layers: ['M12 2 2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5 M2 12l10 5 10-5'],
  zap: 'M13 2 3 14h7l-1 8 10-12h-7l1-8z',
  clock: ['M12 6v6l4 2', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'],
  check: 'M20 6 9 17l-5-5',
  plus: 'M12 5v14 M5 12h14',
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  archive: ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4'],
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  x: 'M18 6 6 18 M6 6l12 12',
  star: 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z',
  trophy: ['M6 9a6 6 0 0 0 12 0V3H6z', 'M6 5H3v2a3 3 0 0 0 3 3 M18 5h3v2a3 3 0 0 1-3 3 M9 21h6 M12 15v6'],
  hourglass: 'M6 2h12 M6 22h12 M8 2c0 3 8 5 8 10s-8 7-8 10 M16 2c0 3-8 5-8 10s8 7 8 10',
  trash: ['M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'],
  drag: ['M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01'],
  target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5L22 3z',
  chevron: 'M9 18l6-6-6-6',
};
function GroupIcon({ g, size = 14 }) {
  const map = { 'do-first': Icons.flame, schedule: Icons.calendar, quick: Icons.zap, later: Icons.hourglass, maybe: Icons.layers };
  return <Ic d={map[g]} size={size} />;
}

/* ---------- Category dot ---------- */
function CatDot({ id, size = 9 }) {
  const c = CAT_MAP[id];
  return <span className="cat-dot" style={{ background: c ? c.color : 'var(--ink-faint)', width: size, height: size }} />;
}

/* ---------- Badge ---------- */
function Badge({ b }) {
  const icon = { 'do-first': Icons.flame, quick: Icons.zap, over: Icons.alert, schedule: Icons.sun }[b.cls];
  return <span className={`badge ${b.cls}`}>{icon && <Ic d={icon} size={11} sw={2} />}{b.text}</span>;
}

/* ---------- Task card ---------- */
function TaskCard({ t, onToggle, onOpen, onDragStart, onDragEnd, dragging, flash, hl, onHover }) {
  const g = groupOf(t);
  const ds = deadlineState(t);
  const badges = badgesOf(t);
  const cat = CAT_MAP[t.category];
  const s = scoreOf(t);
  return (
    <div
      className={`card ${t.done ? 'done' : ''} ${dragging ? 'dragging' : ''} ${flash ? 'flash' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, t)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(t)}
      onMouseEnter={() => onHover && onHover(t.id)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <span className="card-rail" style={{ background: GROUPS[g].color }} />
      <button className={`check ${t.done ? 'done' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(t.id); }} aria-label="完了">
        <Ic d={Icons.check} size={13} sw={3} />
      </button>
      <div className="card-main">
        <div className="card-titlerow">
          <span className="card-title">{t.title}</span>
        </div>
        <div className="card-meta">
          <span className="meta-item cat"><CatDot id={t.category} />{cat ? cat.name : '—'}</span>
          {t.deadline && <span className={`meta-item meta-due ${ds.cls}`}><Ic d={Icons.calendar} size={12} />{ds.label}</span>}
          {t.estMin > 0 && <span className="meta-item"><Ic d={Icons.clock} size={12} />{fmtMinutes(t.estMin)}</span>}
          {badges.map((b, i) => <Badge key={i} b={b} />)}
        </div>
      </div>
      <div className="score">
        <span className="score-num tnum" style={{ color: GROUPS[g].ink }}>{s}</span>
        <span className="score-label">SCORE</span>
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ tasks, activeCat, setCat, activeFilter, setFilter, view, setView, onClose }) {
  const active = tasks.filter(t => !t.done);
  const catCount = (id) => active.filter(t => t.category === id).length;
  const filterCount = (f) => active.filter(FILTERS[f].test).length;
  const doneCount = tasks.filter(t => t.done).length;

  const selectFilter = (f) => { setFilter(f); setView('list'); setCat('all'); onClose && onClose(); };
  const selectCat = (c) => { setCat(c); setView('list'); onClose && onClose(); };

  return (
    <aside className="col sidebar">
      <div className="brand">
        <div className="brand-mark"><Ic d={Icons.target} size={19} sw={2} /></div>
        <div>
          <div className="brand-name">プライオリティ</div>
          <div className="brand-sub">やることを、迷わず決める</div>
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-label">ビュー</div>
        <button className={`nav-item ${view === 'list' && activeFilter === 'all' && activeCat === 'all' ? 'active' : ''}`} onClick={() => { setView('list'); setFilter('all'); setCat('all'); onClose && onClose(); }}>
          <Ic d={Icons.inbox} className="ico" />すべてのタスク<span className="count">{active.length}</span>
        </button>
        <button className={`nav-item ${view === 'matrix' ? 'active' : ''}`} onClick={() => { setView('matrix'); onClose && onClose(); }}>
          <Ic d={Icons.grid} className="ico" />優先度マトリクス
        </button>
        <button className={`nav-item ${view === 'archive' ? 'active' : ''}`} onClick={() => { setView('archive'); onClose && onClose(); }}>
          <Ic d={Icons.archive} className="ico" />完了アーカイブ<span className="count">{doneCount}</span>
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-label">フィルター</div>
        {[
          ['today', Icons.sun], ['week', Icons.calendar], ['overdue', Icons.alert], ['high', Icons.flame], ['loweffort', Icons.zap],
        ].map(([f, ic]) => (
          <button key={f} className={`nav-item ${view === 'list' && activeFilter === f ? 'active' : ''}`} onClick={() => selectFilter(f)}>
            <Ic d={ic} className="ico" />{FILTERS[f].name}<span className="count">{filterCount(f)}</span>
          </button>
        ))}
      </div>

      <div className="nav-group">
        <div className="nav-label">カテゴリ</div>
        {CATEGORIES.map(c => (
          <button key={c.id} className={`nav-item ${view === 'list' && activeCat === c.id ? 'active' : ''}`} onClick={() => selectCat(c.id)}>
            <span className="cat-dot" style={{ background: c.color, width: 10, height: 10 }} />{c.name}<span className="count">{catCount(c.id)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ---------- Priority Matrix ---------- */
function Matrix({ tasks, hlId, onHover, onOpen, compact }) {
  const [tip, setTip] = useState(null);
  const active = tasks.filter(t => !t.done);
  // jitter map so dots at same (imp,urg) don't fully overlap
  const groupsByCell = {};
  active.forEach(t => { const k = `${t.importance}-${t.urgency}`; (groupsByCell[k] = groupsByCell[k] || []).push(t); });

  const pos = (t) => {
    const cell = groupsByCell[`${t.importance}-${t.urgency}`];
    const idx = cell.indexOf(t);
    const n = cell.length;
    // base position (1..5 -> 10%..90%)
    const bx = 6 + (t.urgency - 1) / 4 * 88;
    const by = 6 + (t.importance - 1) / 4 * 88;
    // spread within cell
    let ox = 0, oy = 0;
    if (n > 1) { const ang = (idx / n) * Math.PI * 2; const r = 4.2; ox = Math.cos(ang) * r; oy = Math.sin(ang) * r; }
    return { x: Math.max(4, Math.min(96, bx + ox)), y: Math.max(4, Math.min(96, by + oy)) };
  };

  return (
    <div className="matrix-wrap">
      <div className="matrix">
        <div className="matrix-grid-line" style={{ left: '50%', top: 0, bottom: 0, width: 1 }} />
        <div className="matrix-grid-line" style={{ top: '50%', left: 0, right: 0, height: 1 }} />
        <div className="matrix-quad-label" style={{ right: 6, top: 5, color: 'var(--do-first-ink)' }}>まず着手</div>
        <div className="matrix-quad-label" style={{ left: 6, top: 5, color: 'var(--schedule-ink)' }}>計画する</div>
        <div className="matrix-quad-label" style={{ right: 6, bottom: 5, color: 'var(--quick-ink)' }}>サッと片付け</div>
        <div className="matrix-quad-label" style={{ left: 6, bottom: 5, color: 'var(--maybe-ink)' }}>保留</div>
        {active.map(t => {
          const p = pos(t);
          const g = groupOf(t);
          return (
            <div key={t.id}
              className={`matrix-dot ${hlId === t.id ? 'hl' : ''}`}
              style={{ left: `${p.x}%`, bottom: `${p.y}%`, background: GROUPS[g].color }}
              onMouseEnter={(e) => { onHover && onHover(t.id); setTip({ t, x: p.x, y: p.y }); }}
              onMouseLeave={() => { onHover && onHover(null); setTip(null); }}
              onClick={(e) => { e.stopPropagation(); onOpen && onOpen(t); }}
            />
          );
        })}
        {tip && (
          <div className="matrix-tip" style={{ left: `${tip.x}%`, bottom: `${tip.y + 4}%` }}>
            {tip.t.title}<br/><span style={{ opacity: .7 }}>スコア {scoreOf(tip.t)}・{CAT_MAP[tip.t.category].name}</span>
          </div>
        )}
        <div className="matrix-axis-y">重要度 →</div>
      </div>
      <div className="matrix-axis-x">緊急度 →</div>
    </div>
  );
}

/* ---------- Workload bar ---------- */
function Workload({ tasks }) {
  const todays = tasks.filter(t => !t.done && (() => { const d = daysUntil(t.deadline); return d !== null && d <= 0; })());
  const totalMin = todays.reduce((a, t) => a + (t.estMin || 0), 0);
  const CAP = 240; // 4h recommended daily focus
  const segs = {};
  todays.forEach(t => { const g = groupOf(t); segs[g] = (segs[g] || 0) + (t.estMin || 0); });
  const pct = Math.min(100, (totalMin / CAP) * 100);
  const over = totalMin > CAP;
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><Ic d={Icons.hourglass} size={14} />今日の作業量</div>
        <span className="panel-hint">目安 4時間</span>
      </div>
      <div className="workload-top">
        <div><span className="workload-big tnum" style={{ color: over ? 'var(--do-first-ink)' : 'var(--ink)' }}>{fmtMinutes(totalMin) || '0分'}</span></div>
        <span className="workload-cap">{todays.length}件 / 目安の{Math.round(totalMin / CAP * 100)}%</span>
      </div>
      <div className="bar-track">
        {GROUP_ORDER.filter(g => segs[g]).map(g => (
          <div key={g} className="bar-seg" style={{ width: `${(segs[g] / Math.max(totalMin, CAP)) * 100}%`, background: GROUPS[g].color }} />
        ))}
      </div>
      <div className="bar-legend">
        {GROUP_ORDER.filter(g => segs[g]).map(g => (
          <span key={g} className="legend-item"><span className="legend-dot" style={{ background: GROUPS[g].color }} />{GROUPS[g].title} {fmtMinutes(segs[g])}</span>
        ))}
        {todays.length === 0 && <span className="legend-item" style={{ color: 'var(--ink-faint)' }}>今日締切のタスクはありません</span>}
      </div>
    </div>
  );
}

/* ---------- Recommended next ---------- */
function Recommended({ tasks, onOpen, onHover }) {
  const top = tasks.filter(t => !t.done).sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 4);
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title"><Ic d={Icons.star} size={14} fill sw={0} />今やるべきこと</div>
        <span className="panel-hint">スコア順</span>
      </div>
      {top.map((t, i) => {
        const g = groupOf(t);
        const ds = deadlineState(t);
        return (
          <div key={t.id} className="rec-item" onClick={() => onOpen(t)} onMouseEnter={() => onHover && onHover(t.id)} onMouseLeave={() => onHover && onHover(null)}>
            <span className="rec-rank" style={{ background: GROUPS[g].color }}>{i + 1}</span>
            <div className="rec-main">
              <div className="rec-title">{t.title}</div>
              <div className="rec-sub">{CAT_MAP[t.category].name}{t.deadline ? `・${ds.label}` : ''}{t.estMin ? `・${fmtMinutes(t.estMin)}` : ''}</div>
            </div>
            <span className="rec-score tnum" style={{ color: GROUPS[g].ink }}>{scoreOf(t)}</span>
          </div>
        );
      })}
      {top.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '8px 4px' }}>すべて完了しました 🎉</div>}
    </div>
  );
}

Object.assign(window, { Ic, Icons, GroupIcon, CatDot, Badge, TaskCard, Sidebar, Matrix, Workload, Recommended });
