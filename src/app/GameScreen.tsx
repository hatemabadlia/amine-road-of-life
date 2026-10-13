// In-game screen: 3D canvas + HUD + overlays + global keyboard handling + clock.
import { Component, useEffect, useState, type ReactNode } from 'react';
import { GameCanvas, hasWebGL } from '../game/engine/GameCanvas';
import { HUD, isTouch } from '../game/ui/HUD';
import { Dialogue } from '../game/ui/Dialogue';
import { BigMap, ChapterCard, Journal, PauseMenu } from '../game/ui/Overlays';
import { TouchControls } from '../game/ui/TouchControls';
import { useGame } from '../game/store';
import { clearInput, input, installKeyboard } from '../game/player/input';
import { sound } from '../game/audio/sound';

class CanvasBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="loading">
          <div className="panel" style={{ padding: 24, maxWidth: 480 }}>
            <h2>صرا مشكل في العرض ثلاثي الأبعاد</h2>
            <p style={{ color: 'var(--text-dim)' }}>جرّب تنقص الجودة من الإعدادات، ولا حدّث المتصفح.</p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', direction: 'ltr' }}>{this.state.error}</p>
            <div className="stack">
              <button
                className="btn primary"
                onClick={() => {
                  useGame.getState().updateSettings({ quality: 'low', shadows: false });
                  this.setState({ error: null });
                }}
              >
                عاود بجودة منخفضة
              </button>
              <button className="btn" onClick={() => useGame.getState().toMenu()}>
                القائمة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Letterbox bars during conversations and a fade from black when a chapter starts. */
function Cinema() {
  const talking = useGame((s) => !!s.dialogue);
  const card = useGame((s) => s.card);
  const [fadeKey, setFadeKey] = useState(0);
  const [prevCard, setPrevCard] = useState(card);
  if (card !== prevCard) {
    setPrevCard(card);
    if (!card) setFadeKey((k) => k + 1);
  }
  return (
    <>
      <div className={`letterbox ${talking ? 'on' : ''}`} aria-hidden>
        <i />
        <i />
      </div>
      {fadeKey > 0 && <div className="fade-in" key={fadeKey} aria-hidden />}
    </>
  );
}

export function GameScreen() {
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL);

  // game clock: 1 real second = 1 game minute
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(2, (now - last) / 1000);
      last = now;
      useGame.getState().tick(dt);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  // global keys
  useEffect(() => {
    const cleanup = installKeyboard({
      onKey: (e) => {
        const st = useGame.getState();
        if (e.code === 'Escape') {
          if (st.journal) st.setJournal(false);
          else if (st.bigMap) st.setBigMap(false);
          else if (!st.card) st.setPaused(!st.paused);
          return true;
        }
        if (st.paused || st.card) return false;
        if (e.code === 'Tab') {
          st.setJournal(!st.journal);
          return true;
        }
        if (e.code === 'KeyM') {
          st.setBigMap(!st.bigMap);
          return true;
        }
        if (e.code === 'KeyE' && !st.dialogue && !e.repeat) {
          input.interactQueued = true;
          return true;
        }
        return false;
      },
    });
    const vis = () => {
      if (document.hidden) {
        useGame.getState().setPaused(true);
        clearInput();
        sound.suspend(true);
      } else sound.suspend(false);
    };
    document.addEventListener('visibilitychange', vis);
    const unload = () => useGame.getState().saveNow();
    window.addEventListener('beforeunload', unload);
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('beforeunload', unload);
      clearInput();
    };
  }, []);

  if (!webgl) {
    return (
      <div className="loading">
        <div className="panel" style={{ padding: 24, maxWidth: 460 }}>
          <h2>المتصفح ما يدعمش WebGL</h2>
          <p>اللعبة تحتاج متصفح حديث (Chrome, Firefox, Safari, Edge) مع تفعيل تسريع الرسومات.</p>
          <button className="btn" onClick={() => useGame.getState().toMenu()}>
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CanvasBoundary>
        <GameCanvas onReady={() => setReady(true)} />
      </CanvasBoundary>
      {!ready && (
        <div className="loading" data-testid="loading">
          <div>
            <div className="spinner" />
            <div>نحضّرو الحومة…</div>
          </div>
        </div>
      )}
      {ready && (
        <>
          <Cinema />
          <HUD />
          {isTouch() && <TouchControls />}
          <Dialogue />
          <ChapterCard />
          <Journal />
          <BigMap />
          <PauseMenu />
        </>
      )}
    </>
  );
}
