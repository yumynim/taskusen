/* ===== App — Decision OS ===== */
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

const STORE_KEY = 'prio.tasks.v4';
const CAT_KEY = 'prio.categories.v1';
const ACCENT_KEY = 'prio.accent.v1';
const LEGACY_TASK_KEYS = ['prio.tasks.v3', 'prio.tasks.v2', 'prio.tasks.v1'];
let _seq = 100; const newId = () => `n${Date.now()}_${_seq++}`;
const WD = '日月火水木金土';

// ---- アカウント（ローカルプロフィール）ごとに保存キーを分離 ----
function pk(base, pid) { return (!pid || pid === 'default') ? base : `${base}::${pid}`; }
function loadTasks(pid) {
  try { const r = localStorage.getItem(pk(STORE_KEY, pid)); if (r) return JSON.parse(r); } catch (e) {}
  // 旧バージョンに残っているデモ/サンプル履歴は読み込まず破棄し、まっさらな状態から始める
  if (!pid || pid === 'default') { try { LEGACY_TASK_KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  return [];
}
function saveTasks(pid, t) { try { localStorage.setItem(pk(STORE_KEY, pid), JSON.stringify(t)); } catch (e) {} }
function loadCats(pid) { try { const r = localStorage.getItem(pk(CAT_KEY, pid)); if (r) { const a = JSON.parse(r); if (Array.isArray(a) && a.length) return a; } } catch (e) {} return CATEGORIES.map(c => ({ ...c })); }
function saveCats(pid, c) { try { localStorage.setItem(pk(CAT_KEY, pid), JSON.stringify(c)); } catch (e) {} }
function loadAccent(pid) { try { const r = localStorage.getItem(pk(ACCENT_KEY, pid)); if (r) return r; } catch (e) {} return 'indigo'; }
function saveAccent(pid, id) { try { localStorage.setItem(pk(ACCENT_KEY, pid), id); } catch (e) {} }

// ---- プロフィール（ローカルアカウント）一覧 ----
const PROFILES_KEY = 'prio.profiles.v1';
const ACTIVE_PROFILE_KEY = 'prio.activeProfile.v1';
function loadProfiles() { try { const r = localStorage.getItem(PROFILES_KEY); if (r) { const a = JSON.parse(r); if (Array.isArray(a) && a.length) return a; } } catch (e) {} return [{ id: 'default', name: 'マイタスク' }]; }
function saveProfiles(p) { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)); } catch (e) {} }
function loadActiveProfile() { try { const r = localStorage.getItem(ACTIVE_PROFILE_KEY); if (r) return r; } catch (e) {} return 'default'; }
function saveActiveProfile(id) { try { localStorage.setItem(ACTIVE_PROFILE_KEY, id); } catch (e) {} }
function clearProfileData(pid) { try { [STORE_KEY, CAT_KEY, ACCENT_KEY].forEach(b => localStorage.removeItem(pk(b, pid))); } catch (e) {} }

// ---- リマインダー（ブラウザ通知。ページを開いている間だけ動作） ----
const NOTIFY_KEY = 'prio.notified.v1';
function reminderEnabled() { return typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
function checkReminders(tasks) {
  if (!reminderEnabled()) return;
  let state = {}; try { state = JSON.parse(localStorage.getItem(NOTIFY_KEY) || '{}'); } catch (e) {}
  if (state.day !== TODAY_YMD) state = { day: TODAY_YMD, ids: [] };
  tasks.forEach(t => {
    if (t.done || !t.deadline) return;
    const d = daysUntil(t.deadline);
    if (d !== null && d <= 0 && !state.ids.includes(t.id)) {
      try { new Notification('締切のタスク', { body: `${t.title}（${d < 0 ? Math.abs(d) + '日超過' : '今日が締切'}）`, tag: t.id }); } catch (e) {}
      state.ids.push(t.id);
    }
  });
  try { localStorage.setItem(NOTIFY_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ---------- 完了履歴の日付ラベル / 日付グルーピング ---------- */
function archDayLabel(ymd) {
  if (!ymd) return '日付なし';
  if (ymd === TODAY_YMD) return '今日';
  const y = new Date(TODAY); y.setDate(y.getDate() - 1);
  if (ymd === localYmd(y)) return '昨日';
  const d = new Date(ymd);
  return `${d.getMonth() + 1}月${d.getDate()}日 (${WD[d.getDay()]})`;
}
function groupByDay(list) {
  const map = new Map();
  list.forEach(t => { const k = (t.completedAt || '').slice(0, 10); if (!map.has(k)) map.set(k, []); map.get(k).push(t); });
  return [...map.entries()];
}

/* ---------- segmented 1–5 ---------- */
function MiniSeg({ value, onChange }) {
  return <span className="seg">{[1, 2, 3, 4, 5].map(n => (
    <button key={n} className={n === value ? 'on' : ''} onClick={e => { e.preventDefault(); onChange(n); }}>{n}</button>
  ))}</span>;
}

/* ---------- Quick add ---------- */
function QuickAdd({ onAdd, onDetail, defaultCat, categories }) {
  const [title, setTitle] = useS('');
  const [cat, setCat] = useS(defaultCat && defaultCat !== 'all' ? defaultCat : 'assign');
  const [imp, setImp] = useS(3);
  const [urg, setUrg] = useS(3);
  const [eff, setEff] = useS(2);
  const [deadline, setDeadline] = useS('');
  useE(() => { if (defaultCat && defaultCat !== 'all') setCat(defaultCat); }, [defaultCat]);
  const submit = () => {
    const tt = title.trim(); if (!tt) return;
    onAdd({ id: newId(), title: tt, category: cat, importance: imp, urgency: urg, effort: eff, deadline: deadline || null, estMin: 30, done: false });
    setTitle(''); setImp(3); setUrg(3); setEff(2); setDeadline('');
  };
  return (
    <div>
      <div className="quickadd">
        <Ic d={Icons.plus} size={17} className="plus" sw={1.8} />
        <input className="qa-title" placeholder="やることを入力して Enter…" value={title}
          onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
        <button className="qa-add-btn" disabled={!title.trim()} onClick={submit}>追加</button>
      </div>
      <div className="qa-meta">
        <span className="qa-field"><label>分類</label>
          <select value={cat} onChange={e => setCat(e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </span>
        <span className="qa-field"><label>重要</label><MiniSeg value={imp} onChange={setImp} /></span>
        <span className="qa-field"><label>緊急</label><MiniSeg value={urg} onChange={setUrg} /></span>
        <span className="qa-field"><label>労力</label><MiniSeg value={eff} onChange={setEff} /></span>
        <span className="qa-field"><label>締切</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></span>
        <span className="qa-pred">予測 <b className="tnum">{imp * urg - eff}</b> · {RECO[groupOf({ importance: imp, urgency: urg, effort: eff })]}</span>
      </div>
    </div>
  );
}

/* ---------- Editor ---------- */
function Editor({ task, onSave, onDelete, onClose, categories }) {
  const [d, setD] = useS(() => ({ ...task }));
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const s = d.importance * d.urgency - d.effort;
  const g = groupOf(d);
  const [tagInput, setTagInput] = useS('');
  const tags = d.tags || [];
  const subs = d.subtasks || [];
  const addTag = () => { const v = tagInput.trim().replace(/^#/, ''); if (v && !tags.includes(v)) setD(p => ({ ...p, tags: [...(p.tags || []), v] })); setTagInput(''); };
  const removeTag = tg => setD(p => ({ ...p, tags: (p.tags || []).filter(x => x !== tg) }));
  const addSub = () => setD(p => ({ ...p, subtasks: [...(p.subtasks || []), { id: newId(), title: '', done: false }] }));
  const setSub = (id, patch) => setD(p => ({ ...p, subtasks: (p.subtasks || []).map(x => x.id === id ? { ...x, ...patch } : x) }));
  const delSub = id => setD(p => ({ ...p, subtasks: (p.subtasks || []).filter(x => x.id !== id) }));
  const Row = ({ label, k, hint }) => (
    <div className="field">
      <div className="field-label"><span>{label}</span><span className="hint">{hint}</span></div>
      <div className="rate">{[1, 2, 3, 4, 5].map(n => <button key={n} className={d[k] === n ? 'on' : ''} onClick={() => set(k, n)}>{n}</button>)}</div>
    </div>
  );
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="mh-title">{task._isNew ? 'タスクを追加' : 'タスクを編集'}</div>
            <div className="mh-sub">重要度 × 緊急度 − 労力 から推奨を自動判定</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ic d={Icons.x} size={17} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <div className="field-label">タスク名</div>
            <input type="text" value={d.title} autoFocus onChange={e => set('title', e.target.value)} placeholder="やることを入力" onKeyDown={e => { if (e.key === 'Enter' && d.title.trim()) onSave(d); }} />
          </div>
          <div className="field-row">
            <div className="field"><div className="field-label">分類</div>
              <select value={d.category} onChange={e => set('category', e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="field"><div className="field-label">締切</div>
              <input type="date" value={d.deadline || ''} onChange={e => set('deadline', e.target.value || null)} />
            </div>
          </div>
          <Row label="重要度" k="importance" hint="どれだけ大事か" />
          <Row label="緊急度" k="urgency" hint="どれだけ急ぎか" />
          <Row label="労力" k="effort" hint="どれだけ大変か" />
          <div className="field-row">
            <div className="field"><div className="field-label">想定時間（分）</div>
              <input type="number" min="0" step="5" value={d.estMin} onChange={e => set('estMin', parseInt(e.target.value || '0', 10))} />
            </div>
            <div className="field"><div className="field-label">繰り返し</div>
              <select value={d.repeat || 'none'} onChange={e => set('repeat', e.target.value)}>
                {REPEATS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="field-label"><span>サブタスク</span>{subs.length > 0 && <span className="hint">{subs.filter(x => x.done).length}/{subs.length} 完了</span>}</div>
            {subs.length > 0 && (
              <div className="sub-list">
                {subs.map(x => (
                  <div key={x.id} className="sub-row">
                    <button className={`sub-check ${x.done ? 'done' : ''}`} onClick={() => setSub(x.id, { done: !x.done })} aria-label="完了"><Ic d={Icons.check} size={10} sw={2.8} /></button>
                    <input className={`sub-input ${x.done ? 'done' : ''}`} value={x.title} placeholder="サブタスクを入力" onChange={e => setSub(x.id, { title: e.target.value })} />
                    <button className="sub-del" onClick={() => delSub(x.id)} aria-label="削除"><Ic d={Icons.x} size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            <button className="sub-add" onClick={addSub}><Ic d={Icons.plus} size={13} sw={2} />サブタスクを追加</button>
          </div>

          <div className="field">
            <div className="field-label">タグ</div>
            <div className="tag-edit">
              {tags.map(tg => <span key={tg} className="tag-chip rm" style={{ '--tg': tagColor(tg) }} onClick={() => removeTag(tg)}>{tg}<Ic d={Icons.x} size={10} sw={2.6} /></span>)}
              <input className="tag-input" placeholder="タグを追加（Enter）" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } else if (e.key === 'Backspace' && !tagInput && tags.length) removeTag(tags[tags.length - 1]); }} />
            </div>
          </div>

          <div className="field">
            <div className="field-label">メモ</div>
            <textarea className="note-input" rows={3} value={d.note || ''} placeholder="詳細・リンク・手順など" onChange={e => set('note', e.target.value)} />
          </div>

          <div className="reco-preview">
            <div className="rp-reco">{RECO[g]}</div>
            <div className="rp-div" />
            <div className="rp-text">
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{GROUPS[g].title}・{GROUPS[g].desc}</div>
              <div>{d.importance} × {d.urgency} − {d.effort} ＝ 指数 <b>{s}</b></div>
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

/* ---------- Group section ---------- */
function GroupSection({ g, list, dragState, handlers }) {
  const meta = GROUPS[g];
  const [over, setOver] = useS(false);
  return (
    <div className={`group ${over ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); handlers.onDropGroup(e, g); }}>
      <div className="group-head">
        <span className="group-marker" style={{ background: meta.color }} />
        <span className="group-title">{meta.title}</span>
        <span className="group-en">{meta.en}</span>
        <span className="group-count tnum">{list.length}</span>
        <span className="group-desc">{meta.desc}</span>
      </div>
      <div className="group-list">
        {list.map(t => (
          <DecisionCard key={t.id} t={t} dragging={dragState === t.id} flash={handlers.flashId === t.id}
            onToggle={handlers.onToggle} onOpen={handlers.onOpen} onDragStart={handlers.onDragStart}
            onDragEnd={handlers.onDragEnd} onDropBefore={handlers.onDropBefore} hlId={handlers.hlId} onHover={handlers.onHover} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Chief-of-staff right panel ---------- */
function ChiefOfStaff({ tasks, onOpen, onHover, hlId }) {
  const active = tasks.filter(t => !t.done);
  const ranked = [...active].sort((a, b) => scoreOf(b) - scoreOf(a));
  const top = ranked[0];
  const risks = ranked.filter(isUrgentSignal);
  const opps = ranked.filter(t => groupOf(t) === 'schedule').slice(0, 3);
  const todays = active.filter(t => { const d = daysUntil(t.deadline); return d !== null && d <= 0; });
  const totalMin = todays.reduce((a, t) => a + (t.estMin || 0), 0);
  const CAP = 240;
  const pct = Math.min(100, (totalMin / CAP) * 100);
  const over = totalMin > CAP;
  const dsTop = top ? deadlineState(top) : null;

  const doneToday = completedOn(tasks, TODAY_YMD);
  const dueToday = active.filter(t => { const d = daysUntil(t.deadline); return d !== null && d <= 0; });
  const todayTotal = doneToday + dueToday.length;
  const donePct = todayTotal ? Math.round(doneToday / todayTotal * 100) : 0;
  const streak = streakDays(tasks);

  return (
    <div className="cos">
      {/* TODAY ACHIEVEMENT */}
      <div className="cos-sec cos-today">
        <div className="cos-sec-head">
          <div className="eyebrow">今日の達成</div>
          {streak > 0 && <span className="streak-chip"><Ic d={Icons.bolt} size={12} fill sw={1.4} />連続 {streak}日</span>}
        </div>
        <div className="today-top">
          <div className="today-num"><span className="today-big tnum">{doneToday}</span><span className="today-of tnum">/ {todayTotal} 件 完了</span></div>
          <span className="today-pct tnum">{donePct}%</span>
        </div>
        <div className="cap-track"><div className="cap-fill done" style={{ width: `${donePct}%` }} /></div>
        <div className="today-note">{doneToday === 0 ? 'まずは1件、チェックを付けてみましょう' : donePct >= 100 ? '今日の締切は完了。お見事です。' : `あと ${dueToday.length} 件で今日の締切が片付きます`}</div>
      </div>

      {/* HERO */}
      <div className="cos-sec cos-hero">
        <div className="eyebrow"><span className="dot" />次に取り組むべきこと</div>
        {top ? (
          <React.Fragment>
            <h2 className="cos-title">{top.title}</h2>
            <p className="cos-reason">{heroReason(top)}</p>
            <div className="cos-stats">
              <div className="cos-stat"><label>想定時間</label><b>{fmtMinutes(top.estMin) || '—'}</b></div>
              <div className="cos-stat"><label>重要度</label><b className="tnum">{top.importance} / 5</b></div>
              <div className="cos-stat"><label>締切</label><b className={dsTop && (dsTop.kind === 'over' || dsTop.kind === 'today') ? 'sig' : ''}>{top.deadline ? dsTop.label : 'なし'}</b></div>
            </div>
            <button className="cos-action" onClick={() => onOpen(top)}>このタスクを開く<Ic d={Icons.arrow} size={15} /></button>
          </React.Fragment>
        ) : <p className="cos-reason" style={{ marginTop: 6 }}>未完了のタスクはありません。お疲れさまでした。</p>}
      </div>

      {/* RISK */}
      <div className="cos-sec">
        <div className="cos-sec-head"><div className="eyebrow">リスクアラート</div><span className="meta tnum">{risks.length}件</span></div>
        {risks.length === 0 ? (
          <div className="cos-empty">期限超過・本日締切のタスクはありません。</div>
        ) : risks.slice(0, 4).map(t => {
          const ds = deadlineState(t);
          return (
            <div key={t.id} className="cos-row" onClick={() => onOpen(t)} onMouseEnter={() => onHover(t.id)} onMouseLeave={() => onHover(null)}>
              <span className="cos-row-mark risk" />
              <div className="cos-row-body">
                <div className="cos-row-title">{t.title}</div>
                <div className="cos-row-sub risk">{ds.kind === 'over' ? `期限を${Math.abs(ds.days)}日超過` : '締切は今日'}・{catOf(t.category).name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CAPACITY */}
      <div className="cos-sec">
        <div className="cos-sec-head"><div className="eyebrow">今日のキャパシティ</div><span className="meta tnum">目安 4時間</span></div>
        <div className="cap-top">
          <div><span className={`cap-big tnum ${over ? 'over' : ''}`}>{fmtMinutes(totalMin) || '0分'}</span><span className="cap-of tnum">/ {todays.length}件</span></div>
          <span className={`cap-note tnum ${over ? 'over' : ''}`}>{Math.round(totalMin / CAP * 100)}%{over ? ' · 超過' : ''}</span>
        </div>
        <div className="cap-track"><div className={`cap-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} /></div>
        <div className="cap-marks"><span>0</span><span>2h</span><span>4h</span></div>
      </div>

      {/* OPPORTUNITIES */}
      <div className="cos-sec">
        <div className="cos-sec-head"><div className="eyebrow">戦略的な機会</div><span className="meta">今やると後が楽</span></div>
        {opps.length === 0 ? (
          <div className="cos-empty">先回りして進められる重要タスクはありません。</div>
        ) : opps.map((t, i) => (
          <div key={t.id} className="cos-row" onClick={() => onOpen(t)} onMouseEnter={() => onHover(t.id)} onMouseLeave={() => onHover(null)}>
            <span className="cos-rank tnum">{String(i + 1).padStart(2, '0')}</span>
            <div className="cos-row-body">
              <div className="cos-row-title">{t.title}</div>
              <div className="cos-row-sub">{impactOf(t)}・{fmtMinutes(t.estMin)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MATRIX */}
      <div className="cos-sec">
        <div className="cos-sec-head"><div className="eyebrow">優先度マトリクス</div><span className="meta">重要度 × 緊急度</span></div>
        <Matrix tasks={tasks} hlId={hlId} onHover={onHover} onOpen={onOpen} />
      </div>
    </div>
  );
}

/* ---------- Settings: category manager + accent ---------- */
function SettingsModal({ categories, setCategories, addCategory, deleteCategory, tasks, accent, setAccent, onReset, onClose }) {
  const [pop, setPop] = useS(null);
  const [newName, setNewName] = useS('');
  const [newColor, setNewColor] = useS(CAT_PALETTE[7]);
  const [notif, setNotif] = useS(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const enableNotif = () => { if (typeof Notification !== 'undefined') Notification.requestPermission().then(p => setNotif(p)); };
  const count = id => tasks.filter(t => t.category === id).length;
  const rename = (id, name) => setCategories(cs => cs.map(c => c.id === id ? { ...c, name } : c));
  const recolor = (id, color) => { setCategories(cs => cs.map(c => c.id === id ? { ...c, color } : c)); setPop(null); };
  const doAdd = () => { if (!newName.trim()) return; addCategory(newName, newColor); setNewName(''); setNewColor(CAT_PALETTE[(CAT_PALETTE.indexOf(newColor) + 1) % CAT_PALETTE.length]); };
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div><div className="mh-title">設定</div><div className="mh-sub">カテゴリと差し色をカスタマイズ</div></div>
          <button className="icon-btn" onClick={onClose}><Ic d={Icons.x} size={17} /></button>
        </div>
        <div className="modal-body">
          <div className="set-sec">
            <span className="eyebrow">カテゴリ</span>
            {categories.map(c => (
              <div key={c.id} className="cat-row">
                <div className="cat-swatch" style={{ background: c.color }} onClick={() => setPop(pop === c.id ? null : c.id)} />
                {pop === c.id && (
                  <div className="swatch-pop">
                    {CAT_PALETTE.map(col => <div key={col} className={`sw ${col === c.color ? 'on' : ''}`} style={{ background: col }} onClick={() => recolor(c.id, col)} />)}
                  </div>
                )}
                <input className="cat-name" value={c.name} onChange={e => rename(c.id, e.target.value)} placeholder="カテゴリ名" />
                <span className="cat-count tnum">{count(c.id)}件</span>
                <button className="cat-del" disabled={categories.length <= 1} onClick={() => deleteCategory(c.id)} aria-label="削除"><Ic d={Icons.trash} size={14} /></button>
              </div>
            ))}
            <div className="cat-add">
              <div className="cat-swatch" style={{ background: newColor }} onClick={() => setPop(pop === 'new' ? null : 'new')} />
              {pop === 'new' && (
                <div className="swatch-pop">
                  {CAT_PALETTE.map(col => <div key={col} className={`sw ${col === newColor ? 'on' : ''}`} style={{ background: col }} onClick={() => { setNewColor(col); setPop(null); }} />)}
                </div>
              )}
              <input className="cat-name" placeholder="新しいカテゴリを追加" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doAdd(); }} />
              <button className="btn-add" disabled={!newName.trim()} onClick={doAdd}>追加</button>
            </div>
          </div>
          <div className="set-sec">
            <span className="eyebrow">アクセントカラー</span>
            <div className="accent-row">
              {ACCENTS.map(a => (
                <button key={a.id} className={`accent-opt ${accent === a.id ? 'on' : ''}`} onClick={() => setAccent(a.id)}>
                  <span className="accent-dot" style={{ background: a.main }} />
                  <span className="accent-name">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="set-sec">
            <span className="eyebrow">リマインダー</span>
            <div className="set-data-row">
              <div className="sd-text">
                <div className="sd-title">締切のブラウザ通知</div>
                <div className="sd-sub">今日が締切・期限超過のタスクを通知します。ページを開いている間だけ動作します（常駐通知はサーバーが必要）。</div>
              </div>
              {notif === 'granted' ? <button className="btn btn-ghost" disabled>オン</button>
                : notif === 'denied' ? <button className="btn btn-ghost" disabled>ブロック中</button>
                : notif === 'unsupported' ? <button className="btn btn-ghost" disabled>非対応</button>
                : <button className="btn btn-primary" onClick={enableNotif}>オンにする</button>}
            </div>
          </div>
          <div className="set-sec">
            <span className="eyebrow">データ</span>
            <div className="set-data-row">
              <div className="sd-text">
                <div className="sd-title">すべてのタスクを削除して最初から</div>
                <div className="sd-sub">サンプル（デモ）を消して自分用に始めます。データはこの端末のブラウザに保存され、元には戻せません。</div>
              </div>
              <button className="btn btn-danger-outline" onClick={() => { if (window.confirm('すべてのタスクを削除して最初から始めますか？\nこの操作は元に戻せません。')) { onReset(); onClose(); } }}>リセット</button>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>完了</button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
function Workspace({ profileId, profiles, active: activeProfile, setProfile, addProfile, renameProfile, deleteProfile }) {
  const [tasks, setTasks] = useS(() => loadTasks(profileId));
  const [view, setView] = useS('list');
  const [activeCat, setCat] = useS('all');
  const [activeFilter, setFilter] = useS('all');
  const [sort, setSort] = useS('score');
  const [query, setQuery] = useS('');
  const [editing, setEditing] = useS(null);
  const [hlId, setHl] = useS(null);
  const [flashId, setFlash] = useS(null);
  const [menuOpen, setMenu] = useS(false);
  const [mobView, setMobView] = useS('center');
  const dragId = useR(null);
  const [dragState, setDragState] = useS(null);
  const [categories, setCategories] = useS(() => loadCats(profileId));
  const [accent, setAccent] = useS(() => loadAccent(profileId));
  const [settingsOpen, setSettings] = useS(false);
  applyCats(categories);
  const acc = ACCENTS.find(a => a.id === accent) || ACCENTS[0];

  useE(() => { saveTasks(profileId, tasks); }, [tasks]);
  useE(() => { saveCats(profileId, categories); applyCats(categories); }, [categories]);
  useE(() => { saveAccent(profileId, accent); }, [accent]);
  // リマインダー：通知が許可されていれば、ページを開いている間に締切タスクを通知
  useE(() => { checkReminders(tasks); const id = setInterval(() => checkReminders(tasks), 60000); return () => clearInterval(id); }, [tasks]);

  const addCategory = (name, color) => setCategories(cs => [...cs, { id: newId(), name: name.trim(), color }]);
  const deleteCategory = (id) => { const rest = categories.filter(c => c.id !== id); const fb = rest.length ? rest[0].id : null; setTasks(ts => ts.map(t => t.category === id ? { ...t, category: fb } : t)); setCategories(rest); if (activeCat === id) setCat('all'); };

  const toggle = id => setTasks(ts => {
    const t = ts.find(x => x.id === id);
    // 繰り返しタスクを完了 → 完了として記録しつつ、次回分を自動生成（ルーティン）
    if (t && !t.done && t.repeat && t.repeat !== 'none') {
      const completed = { ...t, done: true, completedAt: localYmd() };
      const next = { ...t, id: newId(), done: false, completedAt: null, deadline: nextRepeatDate(t.deadline, t.repeat), subtasks: (t.subtasks || []).map(s => ({ ...s, done: false })) };
      return [next, ...ts.map(x => x.id === id ? completed : x)];
    }
    return ts.map(x => x.id === id ? { ...x, done: !x.done, completedAt: !x.done ? localYmd() : null } : x);
  });
  const resetData = () => { setTasks([]); setCat('all'); setFilter('all'); setView('list'); };
  const save = d => { setTasks(ts => ts.some(t => t.id === d.id) ? ts.map(t => t.id === d.id ? { ...d, _isNew: undefined } : t) : [{ ...d, _isNew: undefined }, ...ts]); if (d._isNew) { setFlash(d.id); setTimeout(() => setFlash(null), 1100); } setEditing(null); };
  const add = t => { setTasks(ts => [t, ...ts]); setFlash(t.id); setTimeout(() => setFlash(null), 1100); };
  const del = id => { setTasks(ts => ts.filter(t => t.id !== id)); setEditing(null); };
  const openDetail = (draftTitle) => setEditing({ id: newId(), title: draftTitle || '', category: activeCat !== 'all' ? activeCat : 'assign', importance: 3, urgency: 3, effort: 2, deadline: null, estMin: 30, done: false, _isNew: true });

  const onDragStart = (e, t) => { dragId.current = t.id; setDragState(t.id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragEnd = () => { dragId.current = null; setDragState(null); };
  const reorder = (targetId, where) => {
    const from = dragId.current; if (!from || from === targetId) return;
    setTasks(ts => { const arr = [...ts]; const fi = arr.findIndex(t => t.id === from); const moved = arr.splice(fi, 1)[0]; let ti = targetId ? arr.findIndex(t => t.id === targetId) : arr.length; if (where === 'after') ti += 1; arr.splice(ti < 0 ? arr.length : ti, 0, moved); return arr; });
    setSort('manual');
  };
  const onDropBefore = (e, t) => reorder(t.id, 'before');

  const active = tasks.filter(t => !t.done);
  const filtered = useM(() => {
    let l = active;
    if (activeCat !== 'all') l = l.filter(t => t.category === activeCat);
    if (activeFilter !== 'all') l = l.filter(FILTERS[activeFilter].test);
    if (query.trim()) l = l.filter(t => searchMatch(t, query));
    return l;
  }, [tasks, activeCat, activeFilter, query]);
  const sortedFlat = useM(() => { const a = [...filtered]; if (sort === 'score') a.sort((x, y) => scoreOf(y) - scoreOf(x)); return a; }, [filtered, sort, tasks]);
  const byGroup = useM(() => { const m = {}; GROUP_ORDER.forEach(g => m[g] = []); sortedFlat.forEach(t => m[groupOf(t)].push(t)); return m; }, [sortedFlat]);
  const onDropGroup = (e, g) => { const arr = byGroup[g]; const last = arr && arr[arr.length - 1]; if (last && last.id !== dragId.current) reorder(last.id, 'after'); };

  const archived = tasks.filter(t => t.done).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

  const titleInfo = (() => {
    if (view === 'calendar') return { q: 'カレンダー', s: '締切を月単位で俯瞰する' };
    if (view === 'matrix') return { q: '優先度マトリクス', s: '重要度と緊急度で全タスクを俯瞰する' };
    if (view === 'archive') return { q: '完了アーカイブ', s: `${archived.length}件の達成記録` };
    if (query.trim()) return { q: '検索結果', s: `「${query.trim()}」に一致 ${filtered.length}件` };
    if (activeFilter !== 'all') return { q: FILTERS[activeFilter].name, s: `${filtered.length}件のタスク` };
    if (activeCat !== 'all') return { q: CAT_MAP[activeCat].name, s: `${filtered.length}件のタスク` };
    return { q: '次に何をすべきか', s: '推奨順に並んだ意思決定リスト' };
  })();

  const handlers = { onToggle: toggle, onOpen: setEditing, onDragStart, onDragEnd, onDropBefore, onDropGroup, flashId, hlId, onHover: setHl };
  const dateLabel = `${TODAY.getFullYear()}年${TODAY.getMonth() + 1}月${TODAY.getDate()}日 ${WD[TODAY.getDay()]}曜日`;

  return (
    <div className={`app ${menuOpen ? 'menu-open' : ''}`} style={{ '--accent': acc.main, '--accent-ink': acc.ink, '--accent-soft': acc.soft }}>
      <div className="scrim-mob" onClick={() => setMenu(false)} />
      <Sidebar tasks={tasks} categories={categories} activeCat={activeCat} setCat={setCat} activeFilter={activeFilter} setFilter={setFilter} view={view} setView={setView} onManage={() => setSettings(true)} onClose={() => setMenu(false)}
        profiles={profiles} active={activeProfile} setProfile={setProfile} addProfile={addProfile} renameProfile={renameProfile} deleteProfile={deleteProfile} />

      {/* CENTER */}
      <main className={`col center ${mobView === 'right' ? 'mob-hide' : ''}`}>
        <div className="topbar">
          <div className="topbar-head">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <button className="icon-btn mobile-menu-btn" onClick={() => setMenu(true)} style={{ marginTop: 2 }}><Ic d={Icons.menu} size={19} /></button>
              <div>
                <div className="eyebrow">{dateLabel}</div>
                <div className="page-q">{titleInfo.q}</div>
                <div className="page-sub">{titleInfo.s}</div>
              </div>
            </div>
            {view === 'list' && (
              <div className="sort-toggle">
                <button className={sort === 'score' ? 'on' : ''} onClick={() => setSort('score')}>推奨順</button>
                <button className={sort === 'manual' ? 'on' : ''} onClick={() => setSort('manual')}>手動</button>
              </div>
            )}
          </div>
          {view === 'list' && <div style={{ paddingBottom: 4 }}><QuickAdd onAdd={add} onDetail={openDetail} defaultCat={activeCat} categories={categories} /></div>}
          {view === 'list' && (
            <div className="searchbar">
              <Ic d={Icons.search} size={15} className="search-ico" />
              <input className="search-input" placeholder="タスク・メモ・タグを検索…" value={query} onChange={e => setQuery(e.target.value)} />
              {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="クリア"><Ic d={Icons.x} size={14} /></button>}
            </div>
          )}
          {view === 'list' && (
            <div className="filterbar">
              <button className={`fchip ${activeFilter === 'all' && activeCat === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setCat('all'); }}>すべて</button>
              <span className="fsep" />
              {[['today', 0], ['week', 0], ['overdue', 1], ['high', 0], ['loweffort', 0]].map(([f, u]) => (
                <button key={f} className={`fchip ${u ? 'urgent' : ''} ${activeFilter === f ? 'active' : ''}`} onClick={() => setFilter(activeFilter === f ? 'all' : f)}>{FILTERS[f].name}</button>
              ))}
            </div>
          )}
        </div>

        <div className="center-body">
          {view === 'list' && (
            filtered.length === 0 ? (
              <div className="empty"><Ic d={Icons.inbox} size={40} /><div className="empty-title">タスクがありません</div><div className="empty-sub">上の入力欄から追加してみましょう</div></div>
            ) : GROUP_ORDER.filter(g => byGroup[g].length > 0).map(g => (
              <GroupSection key={g} g={g} list={byGroup[g]} dragState={dragState} handlers={handlers} />
            ))
          )}

          {view === 'calendar' && <Calendar tasks={tasks} onOpen={setEditing} />}

          {view === 'matrix' && (
            <div style={{ maxWidth: 560 }}>
              <Matrix tasks={tasks} hlId={hlId} onHover={setHl} onOpen={setEditing} />
              <div className="legend-grid">
                {[['schedule', 'top-left'], ['do-first', 'top-right'], ['maybe', 'bot-left'], ['quick', 'bot-right']].map(([g]) => (
                  <div key={g} className="legend-cell">
                    <div className="lc-top"><span className="lc-title">{GROUPS[g].title}</span><span className="lc-n tnum">{byGroup[g].length}</span></div>
                    <div className="lc-desc">{GROUPS[g].desc}</div>
                  </div>
                ))}
                <div className="legend-cell span2">
                  <div className="lc-top"><span className="lc-title" style={{ color: 'var(--ink-3)' }}>後回しでOK</span><span className="lc-n tnum">{byGroup['later'].length}</span></div>
                  <div className="lc-desc">{GROUPS['later'].desc}・余裕のあるときに着手</div>
                </div>
              </div>
            </div>
          )}

          {view === 'archive' && (
            <div style={{ maxWidth: 720 }}>
              {archived.length === 0 ? (
                <div className="empty"><Ic d={Icons.archive} size={38} /><div className="empty-title">完了タスクはまだありません</div><div className="empty-sub">チェックを付けると、ここに達成記録が残ります</div></div>
              ) : groupByDay(archived).map(([day, items]) => (
                <div key={day || 'none'} className="arch-day">
                  <div className="arch-day-head">
                    <span className="arch-day-label">{archDayLabel(day)}</span>
                    <span className="arch-day-count tnum">{items.length}件 完了</span>
                  </div>
                  {items.map(t => (
                    <div key={t.id} className="arch-item">
                      <button className="dcard-check done" onClick={() => toggle(t.id)}><Ic d={Icons.check} size={11} sw={2.6} /></button>
                      <div style={{ minWidth: 0 }}>
                        <div className="dcard-title">{t.title}</div>
                        <div className="dcard-meta" style={{ marginTop: 6 }}>
                          <span className="meta-dot" style={{ background: catOf(t.category).color }} />
                          <span className="meta-cat">{catOf(t.category).name}</span>
                          {t.estMin > 0 && <span className="meta-item"><Ic d={Icons.clock} size={11} />{fmtMinutes(t.estMin)}</span>}
                        </div>
                      </div>
                      <span className="reco-score tnum">指数 {scoreOf(t)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* RIGHT */}
      <aside className={`col right ${mobView === 'right' ? 'mob-show' : ''}`}>
        <ChiefOfStaff tasks={tasks} onOpen={setEditing} onHover={setHl} hlId={hlId} />
      </aside>

      {/* mobile tabs */}
      <div className="mobile-tabs">
        <button className={mobView === 'center' ? 'on' : ''} onClick={() => setMobView('center')}><Ic d={Icons.inbox} size={14} />タスク</button>
        <button className={mobView === 'right' ? 'on' : ''} onClick={() => setMobView('right')}><Ic d={Icons.target} size={14} />ブリーフ</button>
      </div>

      {editing && <Editor task={editing} categories={categories} onSave={save} onDelete={del} onClose={() => setEditing(null)} />}
      {settingsOpen && <SettingsModal categories={categories} setCategories={setCategories} addCategory={addCategory} deleteCategory={deleteCategory} tasks={tasks} accent={accent} setAccent={setAccent} onReset={resetData} onClose={() => setSettings(false)} />}
    </div>
  );
}

/* ---------- App shell: ローカルアカウント（プロフィール）を管理 ---------- */
function App() {
  const [profiles, setProfiles] = useS(loadProfiles);
  const [profile, setProfileId] = useS(loadActiveProfile);
  useE(() => { saveProfiles(profiles); }, [profiles]);
  useE(() => { saveActiveProfile(profile); }, [profile]);
  const active = profiles.find(p => p.id === profile) || profiles[0];
  const setProfile = id => setProfileId(id);
  const addProfile = name => { const id = newId(); setProfiles(p => [...p, { id, name: (name || '').trim() || '新しいアカウント' }]); setProfileId(id); };
  const renameProfile = (id, name) => setProfiles(p => p.map(x => x.id === id ? { ...x, name } : x));
  const deleteProfile = id => {
    if (id === 'default') return;
    clearProfileData(id);
    setProfiles(p => p.filter(x => x.id !== id));
    if (profile === id) setProfileId('default');
  };
  return <Workspace key={profile} profileId={profile} profiles={profiles} active={active}
    setProfile={setProfile} addProfile={addProfile} renameProfile={renameProfile} deleteProfile={deleteProfile} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
