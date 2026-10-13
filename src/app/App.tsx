import { Suspense, lazy, useEffect } from 'react';
import { useGame } from '../game/store';
import { Menu } from './Menu';
import { EndingScreen } from './Ending';
import { sound } from '../game/audio/sound';
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
    exposeTestHooks();
    // warm the engine chunk in the background while the player reads the menu
    const id = window.setTimeout(() => void import('./GameScreen'), 1500);
    return () => window.clearTimeout(id);
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
