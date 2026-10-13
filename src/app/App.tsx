import { Suspense, lazy, useEffect } from 'react';
import { useGame } from '../game/store';
import { Menu } from './Menu';
import { EndingScreen } from './Ending';
import { sound } from '../game/audio/sound';
import { music, themeFor } from '../game/audio/music';
import { exposeTestHooks } from './testHooks';

// the 3D engine (three.js + Rapier WASM) is only downloaded when play starts
const GameScreen = lazy(() => import('./GameScreen').then((m) => ({ default: m.GameScreen })));

function Loading() {
  return (
    <div className="loading" data-testid="loading">
      <div>
        <div className="spinner" />
        <div>نحمّلو الحومة…</div>
      </div>
    </div>
  );
}

export function App() {
  const screen = useGame((s) => s.screen);
  useEffect(() => {
    const s = useGame.getState().settings;
    sound.setVolumes(s.master, s.ambience, s.sfx);
    music.setVolume(s.music);
    exposeTestHooks();
    // browsers only allow audio after a user gesture: unlock on the first one
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    // the music director: picks the theme for the moment once a second
    const director = window.setInterval(() => {
      const st = useGame.getState();
      const g = st.game;
      const theme = themeFor({
        screen: st.screen,
        age: g?.age ?? 10,
        hour: ((g?.time ?? 600) % 1440) / 60,
        risk: g?.stats.risk ?? 0,
        ending: st.screen === 'ending',
      });
      music.play(theme, st.screen === 'game' ? (g?.chapter ?? 1) : 0);
      music.setDuck(!!st.dialogue);
    }, 1000);
    // warm the engine chunk in the background while the player reads the menu
    const id = window.setTimeout(() => void import('./GameScreen'), 1500);
    return () => {
      window.clearTimeout(id);
      window.clearInterval(director);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  if (screen === 'game')
    return (
      <Suspense fallback={<Loading />}>
        <GameScreen />
      </Suspense>
    );
  if (screen === 'ending') return <EndingScreen />;
  return <Menu />;
}
