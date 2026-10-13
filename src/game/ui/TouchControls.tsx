// Mobile controls: virtual joystick, look-drag zone and action buttons.
import { useRef, useState } from 'react';
import { input } from '../player/input';
import { useGame } from '../store';

export function TouchControls() {
  const knob = useRef<HTMLDivElement>(null);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });
  const [run, setRun] = useState(false);
  const dialogue = useGame((s) => s.dialogue);
  const card = useGame((s) => s.card);
  if (card) return null;

  const updateStick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2);
    let dy = (e.clientY - cy) / (r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    input.stick = { x: dx, y: -dy, active: true };
    if (knob.current) knob.current.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
  };
  const endStick = () => {
    stickId.current = null;
    input.stick = { x: 0, y: 0, active: false };
    if (knob.current) knob.current.style.transform = '';
  };

  return (
    <div className="touch" data-testid="touch-controls">
      <div
        className="look-zone"
        onPointerDown={(e) => {
          if (lookId.current !== null) return;
          lookId.current = e.pointerId;
          lastLook.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== lookId.current) return;
          input.look.dx += (e.clientX - lastLook.current.x) * 1.4;
          input.look.dy += (e.clientY - lastLook.current.y) * 1.4;
          lastLook.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (e.pointerId === lookId.current) lookId.current = null;
        }}
        onPointerCancel={() => (lookId.current = null)}
      />
      {!dialogue && (
        <>
          <div
            className="joystick"
            onPointerDown={(e) => {
              stickId.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateStick(e);
            }}
            onPointerMove={(e) => e.pointerId === stickId.current && updateStick(e)}
            onPointerUp={endStick}
            onPointerCancel={endStick}
            aria-label="جويستيك"
          >
            <div className="knob" ref={knob} />
          </div>
          <div className="touch-buttons">
            <button className="touch-btn act" onPointerDown={() => (input.interactQueued = true)} aria-label="تفاعل">
              تفاعل
            </button>
            <button className="touch-btn" onPointerDown={() => (input.jumpQueued = true)} aria-label="قفز">
              قفز
            </button>
            <button
              className={`touch-btn ${run ? 'on' : ''}`}
              onPointerDown={() => {
                input.runToggle = !input.runToggle;
                setRun(input.runToggle);
              }}
              aria-label="جري"
            >
              {run ? 'جري ✓' : 'جري'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
