/* ===== Priority logic + sample data (plain JS, window globals) ===== */

// 実際の「今日」を基準にする（日々の運用で締切判定が毎日更新される）
const TODAY = new Date();

// ローカルタイムの YYYY-MM-DD（完了履歴・連続記録の基準。タイムゾーンずれを防ぐ）
function localYmd(d) {
  const x = d ? new Date(d) : new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
const TODAY_YMD = localYmd(TODAY);

// 指定日に完了した件数
function completedOn(tasks, ymd) {
  return tasks.filter(t => t.done && (t.completedAt || '').slice(0, 10) === ymd).length;
}
// 今日まで連続で「1件以上完了した日」が続いている日数（今日未完了でも昨日までは維持）
function streakDays(tasks) {
  const days = new Set(tasks.filter(t => t.done && t.completedAt).map(t => t.completedAt.slice(0, 10)));
  let n = 0; const d = new Date(TODAY);
  if (!days.has(localYmd(d))) d.setDate(d.getDate() - 1); // 今日まだなら昨日から数える
  while (days.has(localYmd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---- 繰り返し（ルーティン） ----
const REPEATS = [
  { id: 'none',     name: 'なし' },
  { id: 'daily',    name: '毎日' },
  { id: 'weekdays', name: '平日（月〜金）' },
  { id: 'weekly',   name: '毎週' },
  { id: 'monthly',  name: '毎月' },
];
function repeatLabel(id) { const r = REPEATS.find(x => x.id === id); return r ? r.name : 'なし'; }
// 完了時に作る「次回」の締切日を計算（基準は元の締切、無ければ今日）
function nextRepeatDate(ymd, repeat) {
  const d = ymd ? new Date(ymd) : new Date(TODAY);
  if (repeat === 'daily') d.setDate(d.getDate() + 1);
  else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
  else if (repeat === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (repeat === 'weekdays') { do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); }
  else return ymd;
  return localYmd(d);
}

// ---- サブタスク進捗 ----
function subProgress(t) { const s = t.subtasks || []; return { total: s.length, done: s.filter(x => x.done).length }; }

// ---- タグ（ラベル）に安定した色を割り当て ----
function tagColor(tag) {
  let h = 0; for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return CAT_PALETTE[h % CAT_PALETTE.length];
}

// ---- 検索（タイトル・メモ・タグ・サブタスクを横断） ----
function searchMatch(t, q) {
  if (!q) return true;
  const s = q.trim().toLowerCase(); if (!s) return true;
  if ((t.title || '').toLowerCase().includes(s)) return true;
  if ((t.note || '').toLowerCase().includes(s)) return true;
  if ((t.tags || []).some(x => x.toLowerCase().includes(s))) return true;
  if ((t.subtasks || []).some(x => (x.title || '').toLowerCase().includes(s))) return true;
  return false;
}

// ---- Curated calm palette for categories / custom colors ----
const CAT_PALETTE = [
  '#B4533A', '#C2691D', '#9A7B2E', '#5F7A3E', '#3E7D63', '#2F7E72',
  '#3F6FA3', '#5663C8', '#7A4A86', '#A85C7A', '#8C8B87', '#56657A',
];

// ---- Default categories (user-customizable at runtime) ----
const CATEGORIES = [
  { id: 'assign',   name: '課題',     color: '#B4533A' },
  { id: 'parttime', name: 'バイト',   color: '#C2691D' },
  { id: 'study',    name: '勉強',     color: '#3F6FA3' },
  { id: 'dev',      name: '個人開発', color: '#7A4A86' },
  { id: 'life',     name: '生活',     color: '#3E7D63' },
];
// live map — kept in sync by applyCats() so components always read current
window.CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
function applyCats(list) { window.CAT_MAP = Object.fromEntries(list.map(c => [c.id, c])); }
function catOf(id) { return (window.CAT_MAP && window.CAT_MAP[id]) || { id, name: '未分類', color: '#8E9298' }; }

// ---- Accent themes (app-wide差し色) ----
const ACCENTS = [
  { id: 'graphite', name: 'グラファイト', main: '#2A2E37', ink: '#1B1E25', soft: '#ECEDEF' },
  { id: 'indigo',   name: 'インディゴ',   main: '#4D58C9', ink: '#3A45AE', soft: '#ECEEFB' },
  { id: 'teal',     name: 'ティール',     main: '#2F7E72', ink: '#246A5F', soft: '#E6F2F0' },
  { id: 'clay',     name: 'クレイ',       main: '#B45A3C', ink: '#9A4830', soft: '#F8ECE7' },
  { id: 'plum',     name: 'プラム',       main: '#7A4A86', ink: '#653B70', soft: '#F2EAF4' },
];

// ---- Group definitions (Eisenhower-style, 5 groups) ----
const GROUPS = {
  'do-first': { key: 'do-first', title: 'まず着手',   en: 'DO FIRST',    desc: '重要かつ緊急',            color: 'var(--do-first)', ink: 'var(--do-first-ink)' },
  'schedule': { key: 'schedule', title: '計画する',   en: 'SCHEDULE',    desc: '重要だが急ぎではない',    color: 'var(--schedule)', ink: 'var(--schedule-ink)' },
  'quick':    { key: 'quick',    title: 'サッと片付け', en: 'QUICK WINS', desc: '軽い労力ですぐ終わる',    color: 'var(--quick)',    ink: 'var(--quick-ink)' },
  'later':    { key: 'later',    title: '後回しでOK',  en: 'LATER',       desc: '余裕があるとき',          color: 'var(--later)',    ink: 'var(--later-ink)' },
  'maybe':    { key: 'maybe',    title: '保留・見直し', en: 'MAYBE / DELETE', desc: '本当に必要か検討',     color: 'var(--maybe)',    ink: 'var(--maybe-ink)' },
};
const GROUP_ORDER = ['do-first', 'schedule', 'quick', 'later', 'maybe'];

// ---- Core scoring: Priority = Importance × Urgency − Effort ----
function scoreOf(t) { return t.importance * t.urgency - t.effort; }
// range: 1×1−5 = −4  ...  5×5−1 = 24

// ---- Group categorization ----
function groupOf(t) {
  const imp = t.importance, urg = t.urgency, eff = t.effort;
  const important = imp >= 4;
  const urgent = urg >= 4;
  const lowEffort = eff <= 2;
  const s = scoreOf(t);
  if (important && urgent) return 'do-first';
  if (important && !urgent) return 'schedule';
  if (lowEffort && s >= 4) return 'quick';
  if (s <= 1) return 'maybe';
  return 'later';
}

// ---- Color band for a task (used for rails / dots) ----
function colorVarOf(t) { return GROUPS[groupOf(t)].color; }

// ---- Deadline urgency ----
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function daysUntil(deadline) {
  if (!deadline) return null;
  const a = startOfDay(TODAY);
  const b = startOfDay(new Date(deadline));
  return Math.round((b - a) / 86400000);
}
function deadlineState(t) {
  if (t.done) return { kind: 'none' };
  const d = daysUntil(t.deadline);
  if (d === null) return { kind: 'none' };
  if (d < 0)  return { kind: 'over',  days: d, label: `${Math.abs(d)}日超過`, cls: 'over' };
  if (d === 0) return { kind: 'today', days: 0, label: '今日が締切', cls: 'soon' };
  if (d === 1) return { kind: 'soon',  days: 1, label: '明日まで', cls: 'soon' };
  if (d <= 6)  return { kind: 'week',  days: d, label: `あと${d}日`, cls: '' };
  return { kind: 'far', days: d, label: fmtDate(t.deadline), cls: '' };
}
function fmtDate(s) {
  if (!s) return '期限なし';
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function fmtMinutes(m) {
  if (!m) return '';
  if (m < 60) return `${m}分`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm ? `${h}時間${mm}分` : `${h}時間`;
}

// ---- Badges shown on a card ----
function badgesOf(t) {
  const out = [];
  const ds = deadlineState(t);
  if (ds.kind === 'over') out.push({ cls: 'over', text: '期限超過' });
  const g = groupOf(t);
  if (g === 'do-first') out.push({ cls: 'do-first', text: '最優先' });
  else if (g === 'quick') out.push({ cls: 'quick', text: 'クイックウィン' });
  if (ds.kind === 'today' && g !== 'do-first') out.push({ cls: 'schedule', text: '今日締切' });
  return out;
}

// ---- Filters ----
const FILTERS = {
  all:      { id: 'all',      name: 'すべて',     test: () => true },
  today:    { id: 'today',    name: '今日',       test: t => { const d = daysUntil(t.deadline); return d !== null && d <= 0; } },
  week:     { id: 'week',     name: '今週',       test: t => { const d = daysUntil(t.deadline); return d !== null && d <= 6; } },
  overdue:  { id: 'overdue',  name: '期限超過',   test: t => { const d = daysUntil(t.deadline); return d !== null && d < 0; } },
  high:     { id: 'high',     name: '高優先',     test: t => scoreOf(t) >= 12 },
  loweffort:{ id: 'loweffort',name: '低労力',     test: t => t.effort <= 2 },
};

// ---- Sample data (student life, Japanese) ----
// 締切は「今日」基準の相対日付にして、いつ開いてもデモが自然に見えるようにする
function dPlus(n) { const d = new Date(TODAY); d.setDate(d.getDate() + n); return localYmd(d); }
const SAMPLE_TASKS = [
  { id: 't1',  title: '経済学概論のレポート提出', category: 'assign', importance: 5, urgency: 5, effort: 3, deadline: dPlus(1), estMin: 120, done: false },
  { id: 't2',  title: 'データ構造の課題（実装）', category: 'assign', importance: 4, urgency: 4, effort: 4, deadline: dPlus(2), estMin: 180, done: false },
  { id: 't3',  title: 'バイトのシフト希望を提出', category: 'parttime', importance: 3, urgency: 5, effort: 1, deadline: dPlus(0), estMin: 10, done: false },
  { id: 't4',  title: 'TOEIC単語 100語暗記', category: 'study', importance: 4, urgency: 2, effort: 2, deadline: dPlus(16), estMin: 30, done: false },
  { id: 't5',  title: 'ポートフォリオサイトを作る', category: 'dev', importance: 4, urgency: 2, effort: 5, deadline: dPlus(26), estMin: 600, done: false },
  { id: 't6',  title: '線形代数の演習問題', category: 'study', importance: 3, urgency: 3, effort: 3, deadline: dPlus(4), estMin: 90, done: false },
  { id: 't7',  title: 'ゼミ発表スライドを作成', category: 'assign', importance: 5, urgency: 4, effort: 4, deadline: dPlus(2), estMin: 150, done: false },
  { id: 't8',  title: '図書館で参考文献を借りる', category: 'study', importance: 3, urgency: 4, effort: 1, deadline: dPlus(0), estMin: 20, done: false },
  { id: 't9',  title: '健康診断の予約を取る', category: 'life', importance: 4, urgency: 3, effort: 1, deadline: dPlus(6), estMin: 15, done: false },
  { id: 't10', title: 'サークルの会計報告をまとめる', category: 'life', importance: 3, urgency: 4, effort: 2, deadline: dPlus(-2), estMin: 45, done: false },
  { id: 't11', title: '過去問をコピーして整理', category: 'study', importance: 4, urgency: 5, effort: 2, deadline: dPlus(1), estMin: 30, done: false },
  { id: 't12', title: 'プログラミング講座の動画を視聴', category: 'dev', importance: 3, urgency: 1, effort: 3, deadline: null, estMin: 60, done: false },
  { id: 't13', title: '部屋の片付け', category: 'life', importance: 2, urgency: 2, effort: 3, deadline: null, estMin: 40, done: false },
  { id: 't14', title: '友達と勉強会を計画する', category: 'study', importance: 2, urgency: 3, effort: 2, deadline: dPlus(3), estMin: 25, done: false },
  // completed (archive)
  { id: 't15', title: '英語のリスニング課題を提出', category: 'assign', importance: 4, urgency: 5, effort: 2, deadline: dPlus(-1), estMin: 40, done: true, completedAt: dPlus(-1) },
  { id: 't16', title: 'レジ締めマニュアルを確認', category: 'parttime', importance: 3, urgency: 3, effort: 1, deadline: dPlus(-2), estMin: 15, done: true, completedAt: dPlus(-2) },
  { id: 't17', title: '奨学金の書類を郵送', category: 'life', importance: 5, urgency: 4, effort: 2, deadline: dPlus(-3), estMin: 30, done: true, completedAt: dPlus(0) },
];

// ---- Recommendation verb per group (calm, professional) ----
const RECO = {
  'do-first': '今すぐ',
  'schedule': '計画する',
  'quick':    'すぐ完了',
  'later':    '後で',
  'maybe':    '見直す',
};
function recommendationOf(t) { return RECO[groupOf(t)]; }

// Is this task carrying real time-risk? (drives the rare red signal)
function isUrgentSignal(t) {
  if (t.done) return false;
  const ds = deadlineState(t);
  return ds.kind === 'over' || ds.kind === 'today';
}

// ---- Reasoning chips: the *why*, max 2, most decision-relevant first ----
function reasonChips(t) {
  const out = [];
  const ds = deadlineState(t);
  if (ds.kind === 'over')       out.push({ tone: 'risk', text: `期限を${Math.abs(ds.days)}日超過` });
  else if (ds.kind === 'today') out.push({ tone: 'risk', text: '締切は今日' });
  else if (ds.kind === 'soon')  out.push({ tone: 'warn', text: '締切は明日' });
  else if (ds.kind === 'week')  out.push({ tone: '',     text: `あと${ds.days}日` });

  if (t.importance >= 4)        out.push({ tone: '', text: t.importance >= 5 ? '最重要' : '重要度が高い' });
  else if (t.urgency >= 4)      out.push({ tone: '', text: '緊急度が高い' });

  if (t.effort <= 2 && t.estMin && t.estMin <= 30) out.push({ tone: '', text: `${t.estMin}分で完了` });

  if (out.length === 0) {
    out.push({ tone: 'mute', text: scoreOf(t) <= 1 ? '今は見送ってよい' : '余裕があるとき' });
  }
  return out.slice(0, 2);
}

// ---- Full sentence reasoning for the chief-of-staff hero ----
function heroReason(t) {
  const ds = deadlineState(t);
  let lead;
  if (ds.kind === 'over')       lead = `期限を${Math.abs(ds.days)}日超過しています`;
  else if (ds.kind === 'today') lead = '締切は今日です';
  else if (ds.kind === 'soon')  lead = '締切は明日に迫っています';
  else if (ds.kind === 'week')  lead = `締切まであと${ds.days}日です`;
  else if (t.importance >= 4)   lead = '長期的に重要なタスクです';
  else                          lead = '今のうちに片付けられます';

  let tail;
  if (t.importance >= 5)        tail = '最も重要度が高く、最優先で取り組む価値があります。';
  else if (t.importance >= 4)   tail = '重要度が高く、早めの着手が効果的です。';
  else if (t.effort <= 2)       tail = '労力が小さく、短時間で完了できます。';
  else                          tail = 'まず着手することで、全体が前に進みます。';
  return lead + '。' + tail;
}

// ---- Expected impact (one short phrase) ----
function impactOf(t) {
  if (t.importance >= 4 && isUrgentSignal(t)) return '遅れると影響が大きい';
  if (t.importance >= 4)                      return '成果に直結する';
  if (t.effort <= 2 && scoreOf(t) >= 8)       return '短時間で大きく前進';
  if (groupOf(t) === 'schedule')              return '今やると後が楽になる';
  return '着手で前進する';
}

// expose
Object.assign(window, {
  TODAY, TODAY_YMD, CATEGORIES, GROUPS, GROUP_ORDER, FILTERS, SAMPLE_TASKS, RECO, CAT_PALETTE, ACCENTS,
  scoreOf, groupOf, colorVarOf, daysUntil, deadlineState, fmtDate, fmtMinutes, badgesOf, startOfDay,
  recommendationOf, isUrgentSignal, reasonChips, heroReason, impactOf, applyCats, catOf,
  localYmd, completedOn, streakDays,
  REPEATS, repeatLabel, nextRepeatDate, subProgress, tagColor, searchMatch,
});
