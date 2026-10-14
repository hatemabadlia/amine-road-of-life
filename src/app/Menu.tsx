// Main menu with Algerian skyline art, new game / continue / chapters / endings / settings.
import { useState } from 'react';
import { useGame } from '../game/store';
import { ChapterSelect, ControlsPanel, SettingsPanel } from '../game/ui/Overlays';
import { ALL_ENDINGS, endingById } from '../content/endings';
import { sound } from '../game/audio/sound';

function Skyline() {
  // stylised Tébessa skyline: houses, minaret, palms, Djebel Dyr
  return (
    <svg className="menu-skyline" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <path d="M0 260 L180 150 L320 230 L470 120 L640 220 L820 140 L1000 230 L1200 160 L1200 420 L0 420Z" fill="#5a3550" opacity="0.65" />
      <g fill="#2a1f33">
        <rect x="0" y="300" width="1200" height="120" />
        <rect x="40" y="250" width="120" height="70" />
        <rect x="170" y="220" width="90" height="100" />
        <rect x="270" y="265" width="140" height="60" />
        <rect x="430" y="235" width="110" height="90" />
        <rect x="700" y="245" width="130" height="80" />
        <rect x="845" y="215" width="100" height="110" />
        <rect x="960" y="255" width="150" height="70" />
        <rect x="1120" y="235" width="80" height="90" />
        <rect x="590" y="120" width="26" height="200" />
        <rect x="582" y="150" width="42" height="10" />
        <path d="M590 120 L603 92 L616 120Z" />
        <path d="M548 300 A55 55 0 0 1 658 300Z" />
        <rect x="548" y="270" width="110" height="40" />
      </g>
      <g fill="#ffcf7a" opacity="0.9">
        {[60, 95, 190, 225, 300, 340, 455, 495, 720, 760, 870, 905, 990, 1040, 1140].map((x, i) => (
          <rect key={x} x={x} y={i % 2 ? 275 : 290} width="14" height="14" rx="2" />
        ))}
      </g>
      <g stroke="#2a1f33" strokeWidth="8" fill="none">
        <path d="M1060 330 q-6 -60 6 -110" />
        <path d="M150 330 q8 -50 -4 -100" />
      </g>
      <g fill="#2a1f33">
        <ellipse cx="1066" cy="218" rx="46" ry="12" transform="rotate(-20 1066 218)" />
        <ellipse cx="1066" cy="218" rx="46" ry="12" transform="rotate(25 1066 218)" />
        <ellipse cx="146" cy="228" rx="42" ry="11" transform="rotate(-25 146 228)" />
        <ellipse cx="146" cy="228" rx="42" ry="11" transform="rotate(20 146 228)" />
      </g>
      <circle cx="930" cy="80" r="34" fill="#ffe9b0" opacity="0.85" />
    </svg>
  );
}

type Panel = null | 'settings' | 'controls' | 'chapters' | 'endings' | 'confirmNew';

export function Menu() {
  const hasSave = useGame((s) => s.hasSave);
  const msg = useGame((s) => s.loadMessage);
  const endings = useGame((s) => s.endings);
  const [panel, setPanel] = useState<Panel>(null);
  const st = useGame.getState();

  const start = () => {
    sound.unlock();
    if (hasSave) setPanel('confirmNew');
    else st.newGame();
  };

  return (
    <div className="menu" data-testid="menu">
      <Skyline />
      <div className="menu-content">
        <h1 className="title">أمين</h1>
        <div className="subtitle">طريق الحياة</div>
        <p className="tagline">من العشرة للثمنطاش سنة، في حومة شعبية في تبسة. كل اختيار يبني الطريق: العائلة، القراية، الصحاب، والمستقبل.</p>
        <div className="menu-buttons">
          {hasSave && (
            <button
              className="btn primary"
              onClick={() => {
                sound.unlock();
                st.continueGame();
              }}
              data-testid="continue"
            >
              ▶ كمّل
            </button>
          )}
          <button className={`btn ${hasSave ? '' : 'primary'}`} onClick={start} data-testid="new-game">
            ✦ لعبة جديدة
          </button>
          <button
            className="btn"
            onClick={() => {
              sound.unlock();
              st.loadSnapshotsForMenu();
              setPanel('chapters');
            }}
            data-testid="chapters"
          >
            📖 الفصول
          </button>
          <button className="btn" onClick={() => setPanel('endings')}>
            🌟 النهايات ({endings.length}/{ALL_ENDINGS.length})
          </button>
          <button className="btn" onClick={() => setPanel('settings')}>
            ⚙ الإعدادات
          </button>
          <button className="btn" onClick={() => setPanel('controls')}>
            🎮 التحكم والإتاحة
          </button>
        </div>
        {msg && <div className="menu-note">{msg}</div>}
        <div className="menu-note">68 فصل · 72 نهاية · الحفظ تلقائي في هذا الجهاز</div>
      </div>

      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            {panel === 'confirmNew' && (
              <>
                <h2>لعبة جديدة؟</h2>
                <p>عندك لعبة محفوظة. إذا بديت من جديد، الحفظ القديم يتمسح (النهايات المكتشفة يبقاو).</p>
                <div className="stack">
                  <button
                    className="btn danger"
                    onClick={() => {
                      setPanel(null);
                      st.newGame();
                    }}
                    data-testid="confirm-new"
                  >
                    إيه، ابدا من جديد
                  </button>
                  <button className="btn" onClick={() => setPanel(null)}>
                    لا
                  </button>
                </div>
              </>
            )}
            {panel === 'settings' && (
              <>
                <h2>الإعدادات</h2>
                <SettingsPanel />
              </>
            )}
            {panel === 'controls' && (
              <>
                <h2>التحكم</h2>
                <ControlsPanel />
              </>
            )}
            {panel === 'chapters' && (
              <>
                <h2>الفصول</h2>
                <p style={{ color: 'var(--text-dim)', marginTop: 0 }}>اختار أي فصل. الفصول اللي وصلتلهم مضويين.</p>
                <ChapterSelect />
              </>
            )}
            {panel === 'endings' && (
              <>
                <h2>النهايات</h2>
                <p style={{ color: 'var(--text-dim)', marginTop: 0 }}>
                  كل نهاية = طريق أمين (6) × العائلة (3) × مصير مراد (4). اكتشفت {endings.length} من {ALL_ENDINGS.length}.
                </p>
                <ul className="history" style={{ maxHeight: 320 }}>
                  {endings.length === 0 && <li>مازال ما اكتشفت حتى نهاية.</li>}
                  {endings.map((id) => (
                    <li key={id}>{endingById(id)?.title ?? id}</li>
                  ))}
                </ul>
              </>
            )}
            <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={() => setPanel(null)}>
              رجوع
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
