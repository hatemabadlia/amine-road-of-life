import { useEffect } from 'react';
import { useGame } from '../game/store';
import { Menu } from './Menu';
import { GameScreen } from './GameScreen';
import { EndingScreen } from './Ending';
import { sound } from '../game/audio/sound';
import { exposeTestHooks } from './testHooks';

export function App() {
  const screen = useGame((s) => s.screen);
  useEffect(() => {
    const s = useGame.getState().settings;
    sound.setVolumes(s.master, s.ambience, s.sfx);
    exposeTestHooks();
  }, []);
  if (screen === 'game') return <GameScreen />;
  if (screen === 'ending') return <EndingScreen />;
  return <Menu />;
}
