// Final screen: composed epilogue for the reached ending.
import { useGame } from '../game/store';
import { ALL_ENDINGS, endingById } from '../content/endings';
import { statLabel } from '../game/store';

export function EndingScreen() {
  const game = useGame((s) => s.game);
  const endings = useGame((s) => s.endings);
  if (!game?.ending) return null;
  const e = endingById(game.ending);
  if (!e) return null;
  const highlights = game.history.filter((h) => h.tone && h.tone !== 'neutral').slice(-6);
  return (
    <div className="ending" data-testid="ending">
      <div className="ending-inner">
        <div style={{ color: 'var(--gold)', fontWeight: 700 }}>النهاية · أمين — 18 سنة</div>
        <h1>{e.title}</h1>
        <div className="zellige" style={{ margin: '0 0 20px' }} />
        {e.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div className="panel" style={{ padding: 16, margin: '20px 0' }}>
          <h3 style={{ marginTop: 0 }}>حصاد الطريق</h3>
          {(['trust', 'honesty', 'grades', 'health', 'mourad', 'risk'] as const).map((k) => (
            <div className="row" key={k}>
              <span>{statLabel(k)}</span>
              <b>{game.stats[k]}</b>
            </div>
          ))}
          <div className="row">
            <span>الحصالة</span>
            <b>{game.savings} دج</b>
          </div>
          <h3>قرارات بقات</h3>
          <ul className="history">
            {highlights.map((h, i) => (
              <li key={i}>
                الفصل {h.chapter}: «{h.choice}»
              </li>
            ))}
          </ul>
        </div>
        <p style={{ fontSize: 16, color: '#ffe2c0' }}>
          اكتشفت {endings.length} نهاية من {ALL_ENDINGS.length}. كل طريق آخر يبدا من اختيار صغير.
        </p>
        <div className="stack" style={{ maxWidth: 360 }}>
          <button className="btn primary" onClick={() => useGame.getState().toMenu()} data-testid="ending-menu">
            القائمة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
