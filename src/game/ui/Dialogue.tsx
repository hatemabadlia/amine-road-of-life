// Cinematic dialogue panel with typewriter text and keyboard/mouse/touch choices.
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { speakerColor, speakerName } from '../../content/characters';

export function Dialogue() {
  const dialogue = useGame((s) => s.dialogue);
  const textSpeed = useGame((s) => s.settings.textSpeed);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const [shown, setShown] = useState(0);
  const [sel, setSel] = useState(0);
  const view = dialogue?.view;
  const text = view?.kind === 'line' ? view.text : '';
  const full = shown >= text.length;
  const firstChoice = useRef<HTMLButtonElement>(null);

  // typewriter
  useEffect(() => {
    if (!text) return;
    if (textSpeed === 'instant' || reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const cps = textSpeed === 'fast' ? 90 : 45;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const n = Math.min(text.length, Math.floor(((t - start) / 1000) * cps) + 1);
      setShown(n);
      if (n < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, textSpeed, reduced, dialogue]);

  useEffect(() => {
    setSel(0);
    if (view?.kind === 'choice') setTimeout(() => firstChoice.current?.focus(), 30);
  }, [view]);

  // keyboard for choices and advancing
  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().paused) return;
      if (view.kind === 'choice') {
        const n = Number(e.key);
        if (n >= 1 && n <= view.options.length) {
          e.preventDefault();
          e.stopPropagation();
          useGame.getState().choose(view.options[n - 1].index);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          setSel((s) => (s + 1) % view.options.length);
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          setSel((s) => (s - 1 + view.options.length) % view.options.length);
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          e.stopPropagation();
          useGame.getState().choose(view.options[sel].index);
        }
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        if (!full) setShown(text.length);
        else useGame.getState().advance();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [view, full, text, sel]);

  if (!dialogue || !view) return null;

  if (view.kind === 'choice') {
    return (
      <div className="dialogue panel" role="dialog" aria-label="اختار" data-testid="choices">
        {view.quiz ? (
          <div className="quiz-head" data-testid="quiz">
            <span className="quiz-count">
              {view.quiz.kind === 'math' ? 'مراجعة' : 'ثقافة عامة'} — سؤال {view.quiz.n} من {view.quiz.of}
            </span>
            <bdi dir={view.quiz.kind === 'math' ? 'ltr' : 'rtl'} className={`quiz-expr ${view.quiz.kind}`}>
              {view.quiz.expr}
            </bdi>
          </div>
        ) : (
          <div className="speaker" style={{ background: speakerColor('amine') }}>
            أمين — واش تختار؟
          </div>
        )}
        <div className={view.quiz ? 'choices quiz-options' : 'choices'}>
          {view.options.map((o, i) => (
            <button
              key={o.index}
              ref={i === 0 ? firstChoice : undefined}
              className={`choice ${i === sel ? 'sel' : ''}`}
              onMouseEnter={() => setSel(i)}
              onClick={(e) => {
                e.stopPropagation();
                useGame.getState().choose(o.index);
              }}
              data-testid={`choice-${i}`}
            >
              <span className="num">{i + 1}</span>
              {view.quiz?.kind === 'math' ? <bdi dir="ltr">{o.text}</bdi> : <span>{o.text}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const narrator = view.speaker === 'narrator';
  return (
    <div
      className={`dialogue panel ${narrator ? 'narrator' : ''}`}
      role="dialog"
      aria-live="polite"
      data-testid="dialogue"
      onClick={() => {
        if (!full) setShown(text.length);
        else useGame.getState().advance();
      }}
    >
      {!narrator && (
        <div className="speaker" style={{ background: speakerColor(view.speaker) }}>
          {speakerName(view.speaker)}
        </div>
      )}
      <div className="line">{text.slice(0, shown)}</div>
      <div className="continue-hint">{full ? 'اضغط للمتابعة ◂' : ''}</div>
    </div>
  );
}
