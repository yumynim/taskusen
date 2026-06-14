/* ===== Main App ===== */
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

const STORE_KEY = 'prio.tasks.v3';
function loadTasks() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return SAMPLE_TASKS.map(t => ({ ...t }));
}
function saveTasks(t) { try { localStorage.setItem(STORE_KEY, JSON.stringify(t)); } catch (e) {} }
let _id = 100;
const newId = () => `n${Date.now()}_${_id++}`;

/* ---------- Mini rating (quick add) ---------- */
function MiniRate({ value, onChange, color }) {
  return (
    <span className="mini-rate">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} className={n <= value ? 'on' : ''} style={n <= value ? { background: color, borderColor: color } : null}
          onClick={(e) => { e.preventDefault(); onChange(n); }}>{n === value ? n : ''}</button>
      ))}
    </span>
  );
}

/* ---------- Quick Add bar ---------- */
function QuickAdd({ onAdd, defaultCat }) {
  const [title, setTitle] = useS('');
  const [cat, setCat] = useS(defaultCat && defaultCat !== 'all' ? defaultCat : 'assign');
  const [imp, setImp] = useS(3);
  const [urg, setUrg] = useS(3);
  const [eff, setEff] = useS(2);
  const [deadline, setDeadline] = useS('');
  useE(() => { if (defaultCat && defaultCat !== 'all') setCat(defaultCat); }, [defaultCat]);

  const submit = () => {
    const tt = title.trim();
    if (!tt) return;
    onAdd({ id: newId(), title: tt, category: cat, importance: imp, urgency: urg, effort: eff, deadline: deadline || null, estMin: 30, done: false });
    setTitle(''); setImp(3); setUrg(3); setEff(2); setDeadline('');
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div className="quickadd">
        <Ic d={Icons.plus} size={18} style={{ color: 'var(--accent)' }} sw={2.2} />
        <input className="qa-title" placeholder="タスクを入力してEnter…（例：英語の予習）" value={title}
          onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
        <button className="qa-add-btn" onClick={submit}><Ic d={Icons.plus} size={15} sw={2.4} />追加</button>
      </div>
      <div className="qa-expand">
        <span className="qa-chip"><Ic d={Icons.layers} size={12} style={{ color: 'var(--ink-mute)' }} />
          <select value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </span>
        <span className="qa-chip"><label>重要</label><MiniRate value={imp} onChange={setImp} color="var(--accent)" /></span>
        <span className="qa-chip"><label>緊急</label><MiniRate value={urg} onChange={setUrg} color="var(--do-first)" /></span>
        <span className="qa-chip"><label>労力</label><MiniRate value={eff} onChange={setEff} color="var(--later)" /></span>
        <span className="qa-chip"><Ic d={Icons.calendar} size={12} style={{ color: 'var(--ink-mute)' }} />
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </span>
        <span className="qa-chip" style={{ background: 'var(--surface-sunken)', borderColor: 'transparent' }}>
          <label>予測スコア</label><b className="tnum" style={{ color: GROUPS[groupOf({ importance: imp, urgency: urg, effort: eff })].ink, fontSize: 13 }}>{imp * urg - eff}</b>
        </span>
      </div>
    </div>
  );
}

/* ---------- Task editor modal ---------- */
function Editor({ task, onSave, onDelete, onClose }) {
  const [d, setD] = useS(() => ({ ...task }));
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const s = d.importance * d.urgency - d.effort;
  const g = groupOf(d);
  const RateRow = ({ label, k, cls, hint }) => (
    <div className="field">
      <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{label}</span><span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>{hint}</span></div>
      <div className={`rate ${cls}`}>
        {[1, 2, 3, 4, 5].map(n => <button key={n} className={d[k] === n ? 'on' : ''} onClick={() => set(k, n)}>{n}</button>)}
      </div>
    </div>
  );
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{task._isNew ? 'タスクを追加' : 'タスクを編集'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>重要度 × 緊急度 − 労力 でスコアを自動計算</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ic d={Icons.x} size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <div className="field-label">タスク名</div>
            <input type="text" value={d.title} autoFocus onChange={e => set('title', e.target.value)} placeholder="やることを入力" />
          </div>
          <div className="field-row">
            <div className="field">
              <div className="field-label">カテゴリ</div>
              <select value={d.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="field-label">締切</div>
              <input type="date" value={d.deadline || ''} onChange={e => set('deadline', e.target.value || null)} />
            </div>
          </div>
          <RateRow label="重要度" k="importance" cls="imp" hint="どれだけ大事か" />
          <RateRow label="緊急度" k="urgency" cls="urg" hint="どれだけ急ぎか" />
          <RateRow label="労力" k="effort" cls="eff" hint="どれだけ大変か" />
          <div className="field">
            <div className="field-label">想定時間（分）</div>
            <input type="number" min="0" step="5" value={d.estMin} onChange={e => set('estMin', parseInt(e.target.value || '0', 10))} />
          </div>
          <div className="score-preview">
            <div className="sp-num" style={{ color: GROUPS[g].ink }}>{s}</div>
            <div className="sp-text">
              <div style={{ fontWeight: 700, color: GROUPS[g].ink, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}><GroupIcon g={g} size={13} />{GROUPS[g].title}・{GROUPS[g].desc}</div>
              <div>{d.importance} × {d.urgency} − {d.effort} = <b>{s}</b></div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {!task._isNew && <button className="btn btn-danger" onClick={() => onDelete(task.id)}><Ic d={Icons.trash} size={15} /></button>}
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={() => { if (d.title.trim()) onSave(d); }}>{task._isNew ? '追加する' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Group section with drag-drop ---------- */
function GroupSection({ g, list, dragState, ...handlers }) {
  const meta = GROUPS[g];
  const [over, setOver] = useS(false);
  return (
    <div className={`group ${over ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); handlers.onDropGroup(e, g); }}>
      <div className="group-head">
        <span className="group-bar" style={{ background: meta.color }} />
        <span style={{ color: meta.ink, display: 'flex' }}><GroupIcon g={g} size={15} /></span>
        <span className="group-title">{meta.title}</span>
        <span className="group-en">{meta.en}</span>
        <span className="group-count tnum">{list.length}</span>
        <span className="group-desc">{meta.desc}</span>
      </div>
      <div className="group-list">
        {list.map(t => (
          <div key={t.id} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); handlers.onDropBefore(e, t); }}>
            <TaskCard t={t}
              onToggle={handlers.onToggle} onOpen={handlers.onOpen}
              onDragStart={handlers.onDragStart} onDragEnd={handlers.onDragEnd}
              dragging={dragState === t.id} flash={handlers.flashId === t.id}
              hl={handlers.hlId === t.id} onHover={handlers.onHover} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================================= */
function App() {
  const [tasks, setTasks] = useS(loadTasks);
  const [view, setView] = useS('list');           // list | matrix | archive
  const [activeCat, setCat] = useS('all');
  const [activeFilter, setFilter] = useS('all');
  const [sort, setSort] = useS('score');           // score | manual
  const [editing, setEditing] = useS(null);
  const [hlId, setHl] = useS(null);
  const [flashId, setFlash] = useS(null);
  const [menuOpen, setMenu] = useS(false);
  const [mobView, setMobView] = useS('center');    // center | right
  const dragId = useR(null);
  const [dragState, setDragState] = useS(null);

  useE(() => { saveTasks(tasks); }, [tasks]);

  // ---- task ops ----
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString().slice(0, 10) : null } : t));
  const save = (d) => {
    setTasks(ts => ts.some(t => t.id === d.id) ? ts.map(t => t.id === d.id ? { ...d, _isNew: undefined } : t) : [{ ...d, _isNew: undefined }, ...ts]);
    setEditing(null);
    if (d._isNew) { setFlash(d.id); setTimeout(() => setFlash(null), 900); }
  };
  const add = (t) => { setTasks(ts => [t, ...ts]); setFlash(t.id); setTimeout(() => setFlash(null), 900); };
  const del = (id) => { setTasks(ts => ts.filter(t => t.id !== id)); setEditing(null); };

  // ---- drag reorder ----
  const onDragStart = (e, t) => { dragId.current = t.id; setDragState(t.id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragEnd = () => { dragId.current = null; setDragState(null); };
  const reorder = (targetId, where) => {
    const from = dragId.current; if (!from || from === targetId) return;
    setTasks(ts => {
      const arr = [...ts];
      const fi = arr.findIndex(t => t.id === from);
      const moved = arr.splice(fi, 1)[0];
      let ti = targetId ? arr.findIndex(t => t.id === targetId) : arr.length;
      if (where === 'after') ti += 1;
      arr.splice(ti < 0 ? arr.length : ti, 0, moved);
      return arr;
    });
    setSort('manual');
  };
  const onDropBefore = (e, t) => reorder(t.id, 'before');
  const onDropGroup = (e, g) => { /* drop into group end = move near that group's items */ const last = visibleByGroup[g] && visibleByGroup[g][visibleByGroup[g].length - 1]; if (last && last.id !== dragId.current) reorder(last.id, 'after'); };

  // ---- derived ----
  const active = tasks.filter(t => !t.done);
  const filtered = useM(() => {
    let list = active;
    if (activeCat !== 'all') list = list.filter(t => t.category === activeCat);
    if (activeFilter !== 'all') list = list.filter(FILTERS[activeFilter].test);
    return list;
  }, [tasks, activeCat, activeFilter]);

  const sortedFlat = useM(() => {
    const arr = [...filtered];
    if (sort === 'score') arr.sort((a, b) => scoreOf(b) - scoreOf(a));
    return arr;
  }, [filtered, sort, tasks]);

  const visibleByGroup = useM(() => {
    const m = {}; GROUP_ORDER.forEach(g => m[g] = []);
    sortedFlat.forEach(t => m[groupOf(t)].push(t));
    return m;
  }, [sortedFlat]);

  // page title
  const titleInfo = (() => {
    if (view === 'matrix') return { t: '優先度マトリクス', s: '重要度×緊急度で全タスクを可視化' };
    if (view === 'archive') return { t: '完了アーカイブ', s: '達成したタスクの記録' };
    if (activeFilter !== 'all') return { t: FILTERS[activeFilter].name, s: `${filtered.length}件のタスク` };
    if (activeCat !== 'all') return { t: CAT_MAP[activeCat].name, s: `${filtered.length}件のタスク` };
    return { t: 'すべてのタスク', s: 'スコア順に「まず何をやるか」を表示' };
  })();

  const handlers = { onToggle: toggle, onOpen: (t) => setEditing(t), onDragStart, onDragEnd, onDropBefore, onDropGroup, flashId, hlId, onHover: setHl };

  // ---- views ----
  const archived = tasks.filter(t => t.done).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

  return (
    <div className={`app ${menuOpen ? 'menu-open' : ''}`}>
      <div className="scrim-mob" onClick={() => setMenu(false)} />
      <Sidebar tasks={tasks} activeCat={activeCat} setCat={setCat} activeFilter={activeFilter} setFilter={setFilter} view={view} setView={(v) => { setView(v); }} onClose={() => setMenu(false)} />

      {/* CENTER */}
      <main className={`col center ${mobView === 'right' ? 'mob-hide' : ''}`}>
        <div className="topbar">
          <div className="topbar-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="icon-btn mobile-menu-btn" onClick={() => setMenu(true)}><Ic d={Icons.menu} size={20} /></button>
              <div>
                <div className="page-title">{titleInfo.t}</div>
                <div className="page-sub">{titleInfo.s}</div>
              </div>
            </div>
            {view === 'list' && (
              <div className="sort-toggle">
                <button className={sort === 'score' ? 'on' : ''} onClick={() => setSort('score')}>スコア順</button>
                <button className={sort === 'manual' ? 'on' : ''} onClick={() => setSort('manual')}>手動</button>
              </div>
            )}
          </div>
          {view === 'list' && <QuickAdd onAdd={add} defaultCat={activeCat} />}
          {view === 'list' && (
            <div className="filterbar">
              <button className={`fchip ${activeFilter === 'all' && activeCat === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setCat('all'); }}>すべて</button>
              {['today', 'week', 'overdue', 'high', 'loweffort'].map(f => (
                <button key={f} className={`fchip ${activeFilter === f ? 'active' : ''}`} onClick={() => setFilter(activeFilter === f ? 'all' : f)}>{FILTERS[f].name}</button>
              ))}
              {CATEGORIES.map(c => (
                <button key={c.id} className={`fchip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setCat(activeCat === c.id ? 'all' : c.id)}>
                  <span className="fdot" style={{ background: c.color }} />{c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="center-body">
          {view === 'list' && (
            filtered.length === 0 ? (
              <div className="empty"><Ic d={Icons.inbox} size={42} /><div className="empty-title">タスクがありません</div><div className="empty-sub">上の入力欄から追加してみましょう</div></div>
            ) : (
              GROUP_ORDER.filter(g => visibleByGroup[g].length > 0).map(g => (
                <GroupSection key={g} g={g} list={visibleByGroup[g]} dragState={dragState} {...handlers} />
              ))
            )
          )}

          {view === 'matrix' && (
            <div style={{ maxWidth: 560, margin: '10px auto 0' }}>
              <div className="panel" style={{ padding: '22px 22px 24px' }}>
                <Matrix tasks={tasks} hlId={hlId} onHover={setHl} onOpen={(t) => setEditing(t)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                {GROUP_ORDER.map(g => (
                  <div key={g} className="panel" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: GROUPS[g].color + '22', color: GROUPS[g].ink, display: 'grid', placeItems: 'center' }}><GroupIcon g={g} size={16} /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{GROUPS[g].title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{GROUPS[g].desc}</div>
                    </div>
                    <span className="tnum" style={{ fontSize: 19, fontWeight: 800, color: GROUPS[g].ink }}>{visibleByGroup[g].length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'archive' && (
            <div className="panel" style={{ maxWidth: 640, padding: '6px 18px' }}>
              {archived.length === 0 ? (
                <div className="empty"><Ic d={Icons.archive} size={40} /><div className="empty-title">まだ完了タスクはありません</div></div>
              ) : archived.map(t => (
                <div key={t.id} className="arch-item">
                  <button className="check done" onClick={() => toggle(t.id)}><Ic d={Icons.check} size={13} sw={3} /></button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card-title">{t.title}</div>
                    <div className="card-meta" style={{ marginTop: 4 }}>
                      <span className="meta-item cat"><CatDot id={t.category} />{CAT_MAP[t.category].name}</span>
                      <span className="meta-item"><Ic d={Icons.check} size={12} />{t.completedAt ? `${fmtDate(t.completedAt)} 完了` : '完了'}</span>
                    </div>
                  </div>
                  <span className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-faint)' }}>{scoreOf(t)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* RIGHT */}
      <aside className={`col right ${mobView === 'right' ? 'mob-show' : ''}`}>
        <div className="panel" style={{ background: 'linear-gradient(150deg, #fff, var(--accent-soft))', borderColor: 'transparent' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-ink)', letterSpacing: '.05em' }}>{TODAY.getMonth() + 1}月{TODAY.getDate()}日（{'日月火水木金土'[TODAY.getDay()]}）</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, lineHeight: 1.4 }}>
            {active.length > 0 ? <>まずは<span style={{ color: 'var(--do-first-ink)' }}>「{active.slice().sort((a,b)=>scoreOf(b)-scoreOf(a))[0].title}」</span>から。</> : '今日のタスクは完了！'}
          </div>
        </div>
        <Recommended tasks={tasks} onOpen={(t) => setEditing(t)} onHover={setHl} />
        <div className="panel">
          <div className="panel-head"><div className="panel-title"><Ic d={Icons.grid} size={14} />優先度マトリクス</div><span className="panel-hint">タップで詳細</span></div>
          <Matrix tasks={tasks} hlId={hlId} onHover={setHl} onOpen={(t) => setEditing(t)} />
        </div>
        <Workload tasks={tasks} />
      </aside>

      {/* mobile tabs */}
      <div className="mobile-tabs">
        <button className={mobView === 'center' ? 'on' : ''} onClick={() => setMobView('center')}><Ic d={Icons.inbox} size={15} />タスク</button>
        <button className={mobView === 'right' ? 'on' : ''} onClick={() => setMobView('right')}><Ic d={Icons.grid} size={15} />ダッシュボード</button>
      </div>

      {editing && <Editor task={editing} onSave={save} onDelete={del} onClose={() => setEditing(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
