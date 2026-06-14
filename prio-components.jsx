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
};

/* ---------- Decision card ---------- */
function DecisionCard({ t, onToggle, onOpen, onDragStart, onDragEnd, onDropBefore, dragging, flash, hlId, onHover }) {
  const chips = reasonChips(t);
  const reco = recommendationOf(t);
  const urgent = isUrgentSignal(t);
  const ds = deadlineState(t);
  const cat = catOf(t.category);
  const g = groupOf(t);
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
          <div className="dcard-meta">
            <span className="meta-dot" style={{ background: cat.color }} />
            <span className="meta-cat">{cat.name}</span>
            {t.estMin > 0 && <span className="meta-item"><Ic d={Icons.clock} size={11} />{fmtMinutes(t.estMin)}</span>}
            {t.deadline && <span className="meta-item"><Ic d={Icons.calendar} size={11} />{fmtDate(t.deadline)}</span>}
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

/* ---------- Sidebar ---------- */
function Sidebar({ tasks, categories, activeCat, setCat, activeFilter, setFilter, view, setView, onManage, onClose }) {
  const active = tasks.filter(t => !t.done);
  const catCount = id => active.filter(t => t.category === id).length;
  const fCount = f => active.filter(FILTERS[f].test).length;
  const doneCount = tasks.filter(t => t.done).length;
  const overdue = active.filter(FILTERS.overdue.test).length;

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

      <div className="nav-group">
        <div className="nav-label">ビュー</div>
        <button className={`nav-item ${view === 'list' && activeFilter === 'all' && activeCat === 'all' ? 'active' : ''}`} onClick={() => go(() => { setView('list'); setFilter('all'); setCat('all'); })}>
          <Ic d={Icons.inbox} className="ico" />すべてのタスク<span className="count tnum">{active.length}</span>
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

Object.assign(window, { Ic, Icons, DecisionCard, Sidebar, Matrix });
