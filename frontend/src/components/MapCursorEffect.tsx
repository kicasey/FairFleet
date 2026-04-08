'use client';

import { useState, useEffect, useCallback } from 'react';

interface MapCursorEffectProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function MapCursorEffect({ containerRef }: Readonly<MapCursorEffectProps>) {
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  }, [containerRef]);

  const handleMouseLeave = useCallback(() => {
    setPos(p => ({ ...p, visible: false }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, handleMouseMove, handleMouseLeave]);

  if (!pos.visible) return null;

  return (
    <>
      {/* Warm glow that brightens the area instead of dimming everything else */}
      <div
        className="absolute pointer-events-none z-20 rounded-full"
        style={{
          left: pos.x - 60,
          top: pos.y - 60,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Glow ring */}
      <div
        className="absolute pointer-events-none z-30"
        style={{ left: pos.x - 30, top: pos.y - 30, width: 60, height: 60 }}
      >
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{
            background: 'radial-gradient(circle, #2875F1 0%, transparent 70%)',
            animationDuration: '2.5s',
          }}
        />
        <div
          className="absolute inset-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(40,117,241,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bg-[#2875F1] rounded-full"
          style={{
            width: 5,
            height: 5,
            left: 27.5,
            top: 27.5,
            boxShadow: '0 0 6px rgba(40,117,241,0.4)',
          }}
        />
      </div>
    </>
  );
}
