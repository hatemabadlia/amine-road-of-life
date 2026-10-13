// In-game heads-up display: mission, status, minimap, prompt and notifications.
import { useEffect, useRef, useState } from 'react';
import { activeObjective, chapterOf, livePose, objectiveTarget, uiTiming, useGame } from '../store';
import { formatTime } from '../story/engine';
import { camState, npcPositions, useFocus } from '../engine/refs';
import { drawMap } from './mapDraw';

export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

function timeIcon(min: number) {
  const h = (min % 1440) / 60;
  if (h < 5.5 || h >= 20) return '🌙';
  if (h < 8) return '🌅';
  if (h >= 18) return '🌇';
  return '☀️';
}

function Mission() {
  const game = useGame((s) => s.game);
  const arrow = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const obj = activeObjective(game);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const st = useGame.getState();
      const o = activeObjective(st.game);
      const t = objectiveTarget(o, (id) => {
        const p = npcPositions.get(id);
        return p ? [p.x, p.z] : null;
      });
      if (t && arrow.current && distRef.current) {
        const dx = t[0] - livePose.x;
        const dz = t[1] - livePose.z;
        const d = Math.hypot(dx, dz);
        // angle relative to camera forward
        const world = Math.atan2(dx, dz);
        const camFwd = Math.atan2(-Math.sin(camState.yaw), -Math.cos(camState.yaw));
        const rel = world - camFwd;
        arrow.current.style.transform = `rotate(${-rel}rad)`;
        distRef.current.textContent = d < 3 ? 'هنا' : `${Math.round(d)} م`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!game) return null;
  const ch = chapterOf(game);
  return (
    <div className="mission panel" data-testid="mission">
      <div className="chapter-tag">المهمة {String(ch.id).padStart(2, '0')} · {ch.title}</div>
      <div className="mission-title">{ch.mission}</div>
      {obj ? (
        <div className="objective" data-testid="objective">
          <span className="dot" />
          <span>{obj.text}</span>
        </div>
      ) : (
        <div className="objective" data-testid="objective">
          <span className="dot" />
          <span>…</span>
        </div>
      )}
      <div className="meta">
        {obj && (
          <>
            <span className="dir-arrow" ref={arrow} aria-hidden>
              ▲
            </span>
            <span ref={distRef} />
          </>
        )}
        {obj?.deadline && <span>⏰ قبل {obj.deadline}</span>}
      </div>
    </div>
  );
}

function Status() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  return (
    <div className="status">
      <div className="chip panel" data-testid="clock">
        {timeIcon(game.time)} {formatTime(game.time)}
      </div>
      <div className="chip panel" data-testid="money">
        💰 {game.money} دج
      </div>
      <div className="chip panel">🎂 {game.age} سنين</div>
    </div>
  );
}

function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const show = useGame((s) => s.settings.minimap);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 80) return;
      last = t;
      const c = canvas.current;
      if (!c) return;
      const st = useGame.getState();
      const o = activeObjective(st.game);
      const target = objectiveTarget(o, (id) => {
        const p = npcPositions.get(id);
        return p ? [p.x, p.z] : null;
      });
      drawMap(c, { cx: livePose.x, cz: livePose.z, radius: 42, player: livePose, target, rotateWithCamera: true, camYaw: camState.yaw });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!show) return null;
  return <canvas ref={canvas} width={200} height={200} className={`minimap ${isTouch() ? 'touchmode' : ''}`} onClick={() => useGame.getState().setBigMap(true)} aria-label="الخريطة" />;
}

function Prompt() {
  const focus = useFocus((s) => s.focus);
  const dialogue = useGame((s) => s.dialogue);
  if (!focus || dialogue) return null;
  return (
    <div
      className={`prompt panel ${focus.objective ? 'objective' : ''}`}
      data-testid="prompt"
      onClick={() => {
        // ignore the tail of a double-click that just closed a dialogue
        if (performance.now() - uiTiming.dialogueClosedAt < 500) return;
        useGame.getState().interact(focus.id, focus.kind);
      }}
    >
      <span className="key">{isTouch() ? '👆' : 'E'}</span>
      <span>{focus.label}</span>
    </div>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast panel ${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

function SaveFlash() {
  const flash = useGame((s) => s.saveFlash);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!flash) return;
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(id);
  }, [flash]);
  return visible ? (
    <div className="save-flash" key={flash}>
      💾 تحفظت
    </div>
  ) : null;
}

export function HUD() {
  const card = useGame((s) => s.card);
  const talking = useGame((s) => !!s.dialogue);
  if (card) return null;
  return (
    <div className={`hud ${talking ? 'cine' : ''}`}>
      <Mission />
      <Status />
      <div className="hud-buttons">
        <button className="icon-btn" aria-label="توقيف" title="توقيف (Esc)" onClick={() => useGame.getState().setPaused(true)} data-testid="pause-btn">
          ☰
        </button>
        <button className="icon-btn" aria-label="دفتر أمين" title="دفتر أمين (Tab)" onClick={() => useGame.getState().setJournal(true)}>
          📓
        </button>
        <button className="icon-btn" aria-label="الخريطة" title="الخريطة (M)" onClick={() => useGame.getState().setBigMap(true)}>
          🗺️
        </button>
      </div>
      <Minimap />
      <Prompt />
      <Toasts />
      <SaveFlash />
    </div>
  );
}
