// Full-screen overlays: chapter card, pause menu, settings, controls, journal, map, chapter select.
import { useEffect, useRef, useState } from 'react';
import { ACT_TITLES, CHAPTERS } from '../../content/chapters';
import { ALL_ENDINGS } from '../../content/endings';
import { STAT_KEYS } from '../../types/game';
import { chapterOf, livePose, objectiveTarget, activeObjective, statLabel, useGame, type Settings } from '../store';
import { npcPositions } from '../engine/refs';
import { drawMap } from './mapDraw';

export function ChapterCard() {
  const card = useGame((s) => s.card);
  const game = useGame((s) => s.game);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!card) return;
    btn.current?.focus();
    // ignore keys for a moment so mashing through the previous dialogue doesn't skip the card
    const shownAt = performance.now();
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && (e.repeat || performance.now() - shownAt < 900)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        useGame.getState().dismissCard();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [card]);
  if (!card || !game) return null;
  const ch = chapterOf(game);
  return (
    <div className="card" data-testid="chapter-card">
      <div className="card-inner">
        <div className="act">{ACT_TITLES[ch.act]}</div>
        <div className="num">الفصل {String(ch.id).padStart(2, '0')} من 68</div>
        <h1>{ch.title}</h1>
        <div className="age">أمين — {ch.age} سنين</div>
        <div className="zellige" />
        <p>{ch.summary}</p>
        <button ref={btn} className="btn primary" onClick={() => useGame.getState().dismissCard()} data-testid="start-chapter">
          ابدا الفصل ◂
        </button>
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const s = useGame((st) => st.settings);
  const set = (p: Partial<Settings>) => useGame.getState().updateSettings(p);
  const range = (k: 'master' | 'ambience' | 'sfx' | 'sensitivity', label: string, max = 1, min = 0) => (
    <div className="row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={0.05} value={s[k]} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<Settings>)} aria-label={label} />
    </div>
  );
  const toggle = (k: 'shadows' | 'invertY' | 'reducedMotion' | 'minimap', label: string) => (
    <div className="row">
      <span>{label}</span>
      <input type="checkbox" checked={s[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<Settings>)} aria-label={label} />
    </div>
  );
  return (
    <div>
      <h3>الصوت</h3>
      {range('master', 'الصوت العام')}
      {range('ambience', 'أصوات الحومة')}
      {range('sfx', 'المؤثرات')}
      <h3>الصورة</h3>
      <div className="row">
        <span>الجودة</span>
        <select value={s.quality} onChange={(e) => set({ quality: e.target.value as Settings['quality'] })} aria-label="الجودة">
          <option value="high">عالية</option>
          <option value="medium">متوسطة</option>
          <option value="low">منخفضة (للتيليفونات الضعيفة)</option>
        </select>
      </div>
      {toggle('shadows', 'الظلال')}
      {toggle('minimap', 'الخريطة الصغيرة')}
      <h3>التحكم والإتاحة</h3>
      {range('sensitivity', 'حساسية الكاميرا', 2.5, 0.3)}
      {toggle('invertY', 'عكس المحور العمودي')}
      {toggle('reducedMotion', 'تقليل الحركة')}
      <div className="row">
        <span>سرعة النص</span>
        <select value={s.textSpeed} onChange={(e) => set({ textSpeed: e.target.value as Settings['textSpeed'] })} aria-label="سرعة النص">
          <option value="normal">عادية</option>
          <option value="fast">سريعة</option>
          <option value="instant">فورية</option>
        </select>
      </div>
    </div>
  );
}

export function ControlsPanel() {
  const rows: [string, string][] = [
    ['W A S D / الأسهم', 'المشي'],
    ['Shift', 'الجري'],
    ['Space', 'القفز'],
    ['الفأرة / السحب', 'تدوير الكاميرا'],
    ['عجلة الفأرة', 'تقريب / تبعيد'],
    ['E', 'التفاعل'],
    ['Space / Enter / النقر', 'متابعة الحوار'],
    ['1 – 4 أو الأسهم', 'اختيار الجواب'],
    ['Tab', 'دفتر أمين'],
    ['M', 'الخريطة'],
    ['Esc', 'توقيف / حفظ'],
  ];
  return (
    <div>
      <table className="kbd-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>
                <span className="key" style={{ minWidth: 0, padding: '0 8px', fontSize: 13 }}>
                  {k}
                </span>
              </td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>في التيليفون: الجويستيك على اليسار للمشي، اسحب في اليمين باش تدوّر الكاميرا، والأزرار للتفاعل والقفز والجري.</p>
    </div>
  );
}

export function ChapterSelect({ onDone }: { onDone?: () => void }) {
  const snapshots = useGame((s) => s.snapshots);
  const current = useGame((s) => s.game?.chapter ?? 0);
  const [confirm, setConfirm] = useState<number | null>(null);
  const available = new Set(Object.keys(snapshots).map(Number));
  if (confirm !== null) {
    return (
      <div className="stack">
        <p>
          تعاود الفصل {confirm}؟ التقدّم بعد هذا الفصل يتمسح، والقرارات اللي جاو من بعد يتعاودو.
        </p>
        <button
          className="btn primary"
          onClick={() => {
            useGame.getState().replayChapter(confirm);
            onDone?.();
          }}
          data-testid="confirm-replay"
        >
          إيه، نعاود
        </button>
        <button className="btn" onClick={() => setConfirm(null)}>
          لا
        </button>
      </div>
    );
  }
  return (
    <div className="chapter-list">
      {CHAPTERS.map((c) => (
        <button key={c.id} className="chapter-item" disabled={!available.has(c.id)} onClick={() => setConfirm(c.id)}>
          <b>
            {String(c.id).padStart(2, '0')} {c.id === current ? '• الحالي' : ''}
          </b>
          {c.title}
        </button>
      ))}
    </div>
  );
}

export function Journal() {
  const open = useGame((s) => s.journal);
  const game = useGame((s) => s.game);
  const endings = useGame((s) => s.endings);
  if (!open || !game) return null;
  const close = () => useGame.getState().setJournal(false);
  return (
    <div className="overlay" onClick={close}>
      <div className="modal panel" onClick={(e) => e.stopPropagation()} data-testid="journal">
        <h2>📓 دفتر أمين</h2>
        <div className="bars">
          {STAT_KEYS.map((k) => {
            const v = game.stats[k];
            const warn = k === 'risk' || k === 'anger' ? v > 50 : v < 35;
            return (
              <div className="bar" key={k}>
                <label>
                  <span>{statLabel(k)}</span>
                  <span>{v}</span>
                </label>
                <div className="track">
                  <div className={`fill ${warn ? 'warn' : ''}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span>💰 في الجيب</span>
          <b>{game.money} دج</b>
        </div>
        <div className="row">
          <span>🐷 الحصالة</span>
          <b>{game.savings} دج</b>
        </div>
        <div className="row">
          <span>📖 الفصول المكمّلة</span>
          <b>{game.completed.length} / 68</b>
        </div>
        <div className="row">
          <span>🌟 النهايات المكتشفة</span>
          <b>
            {endings.length} / {ALL_ENDINGS.length}
          </b>
        </div>
        <h3>آخر القرارات</h3>
        <ol className="history">
          {game.history
            .slice(-12)
            .reverse()
            .map((h, i) => (
              <li key={i}>
                ف{h.chapter}: «{h.choice}»
              </li>
            ))}
        </ol>
        <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={close}>
          سكّر
        </button>
      </div>
    </div>
  );
}

export function BigMap() {
  const open = useGame((s) => s.bigMap);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const loop = () => {
      const c = canvas.current;
      if (c) {
        const st = useGame.getState();
        const target = objectiveTarget(activeObjective(st.game), (id) => {
          const p = npcPositions.get(id);
          return p ? [p.x, p.z] : null;
        });
        drawMap(c, { cx: 0, cz: -4, radius: 80, player: livePose, target, labels: true });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open]);
  if (!open) return null;
  const close = () => useGame.getState().setBigMap(false);
  return (
    <div className="overlay bigmap" onClick={close}>
      <div className="panel" style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
        <canvas ref={canvas} width={900} height={900} aria-label="خريطة الحومة" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 10 }}>
          <span style={{ color: 'var(--text-dim)' }}>⬆ الشمال · 🟡 الهدف · ⬆ أمين</span>
          <button className="btn small" onClick={close}>
            سكّر
          </button>
        </div>
      </div>
    </div>
  );
}

export function PauseMenu() {
  const paused = useGame((s) => s.paused);
  const [tab, setTab] = useState<'main' | 'settings' | 'controls' | 'chapters'>('main');
  const [confirmQuit, setConfirmQuit] = useState(false);
  useEffect(() => {
    if (paused) {
      setTab('main');
      setConfirmQuit(false);
    }
  }, [paused]);
  if (!paused) return null;
  const st = useGame.getState();
  return (
    <div className="overlay" data-testid="pause-menu">
      <div className="modal panel">
        <h2>⏸ توقّف</h2>
        <div className="tabs">
          {(
            [
              ['main', 'القائمة'],
              ['settings', 'الإعدادات'],
              ['controls', 'التحكم'],
              ['chapters', 'الفصول'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={`btn small ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>
        {tab === 'main' && (
          <div className="stack">
            <button className="btn primary" onClick={() => st.setPaused(false)} data-testid="resume">
              كمّل اللعب
            </button>
            <button className="btn" onClick={() => st.saveNow(true)} data-testid="save-btn">
              💾 احفظ دروك
            </button>
            <button className="btn" onClick={() => st.unstuck()}>
              🧭 أمين علق؟ رجّعو لبلاصة قريبة
            </button>
            {!confirmQuit ? (
              <button className="btn danger" onClick={() => setConfirmQuit(true)}>
                ارجع للقائمة الرئيسية
              </button>
            ) : (
              <div className="stack">
                <p style={{ margin: 0 }}>اللعبة راهي محفوظة تلقائيا. ترجع للقائمة؟</p>
                <button className="btn danger" onClick={() => st.toMenu()}>
                  إيه
                </button>
              </div>
            )}
          </div>
        )}
        {tab === 'settings' && <SettingsPanel />}
        {tab === 'controls' && <ControlsPanel />}
        {tab === 'chapters' && <ChapterSelect onDone={() => st.setPaused(false)} />}
      </div>
    </div>
  );
}
