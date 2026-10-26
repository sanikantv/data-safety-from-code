// Small building blocks shared by the scenes. Each animated piece reads the frame itself, so a
// scene re-renders only the parts that move.
import type React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, MONO, SANS } from './theme';

/** Fades and slides its children in, starting `delay` seconds into the scene. */
export const Enter: React.FC<{
  readonly delay?: number;
  readonly from?: 'bottom' | 'left' | 'right' | 'scale';
  readonly distance?: number;
  readonly style?: React.CSSProperties;
  readonly children: React.ReactNode;
}> = ({ delay = 0, from = 'bottom', distance = 40, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay * fps, fps, config: { damping: 200, stiffness: 120 } });
  const d = (1 - p) * distance;
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' }),
        translate: from === 'bottom' ? `0 ${d}px` : from === 'left' ? `${-d}px 0` : from === 'right' ? `${d}px 0` : undefined,
        scale: from === 'scale' ? interpolate(p, [0, 1], [0.85, 1]) : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Icon: React.FC<{ readonly name: string; readonly size?: number; readonly fill?: boolean; readonly color?: string }> = ({
  name,
  size = 40,
  fill,
  color,
}) => (
  <span
    style={{
      fontFamily: 'Material Symbols Rounded',
      fontSize: size,
      lineHeight: 1,
      color,
      fontVariationSettings: fill ? "'FILL' 1" : undefined,
      display: 'inline-block',
    }}
  >
    {name}
  </span>
);

export const Scene: React.FC<{ readonly children: React.ReactNode; readonly style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ backgroundColor: C.surface, fontFamily: SANS, color: C.onSurface, padding: '120px 160px', ...style }}>
    {children}
  </AbsoluteFill>
);

export const Title: React.FC<{ readonly children: React.ReactNode; readonly size?: number; readonly style?: React.CSSProperties }> = ({
  children,
  size = 96,
  style,
}) => (
  <h1 style={{ margin: 0, fontSize: size, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.02em', ...style }}>{children}</h1>
);

export const Em: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => <span style={{ color: C.primary }}>{children}</span>;

export const Card: React.FC<{ readonly children: React.ReactNode; readonly style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.surfaceLowest,
      border: `2px solid ${C.outlineVariant}`,
      borderRadius: 44,
      padding: 40,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Code: React.FC<{ readonly children: React.ReactNode; readonly size?: number; readonly color?: string }> = ({
  children,
  size = 30,
  color = C.onSurfaceVariant,
}) => <span style={{ fontFamily: MONO, fontSize: size, color }}>{children}</span>;

export const Badge: React.FC<{ readonly children: React.ReactNode; readonly tone?: 'primary' | 'secondary' | 'tertiary' }> = ({
  children,
  tone = 'secondary',
}) => {
  const bg = tone === 'primary' ? C.primaryContainer : tone === 'tertiary' ? C.tertiaryContainer : C.secondaryContainer;
  const fg = tone === 'primary' ? C.onPrimaryContainer : tone === 'tertiary' ? C.onTertiaryContainer : C.onSecondaryContainer;
  return (
    <span style={{ background: bg, color: fg, borderRadius: 16, padding: '8px 18px', fontSize: 28, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
};

export const IconTile: React.FC<{ readonly name: string; readonly size?: number; readonly tone?: 'primary' | 'tertiary' }> = ({
  name,
  size = 76,
  tone = 'primary',
}) => (
  <span
    style={{
      display: 'grid',
      placeItems: 'center',
      width: size,
      height: size,
      flex: 'none',
      borderRadius: size * 0.3,
      background: tone === 'primary' ? C.primaryContainer : C.tertiaryContainer,
      color: tone === 'primary' ? C.onPrimaryContainer : C.onTertiaryContainer,
    }}
  >
    <Icon name={name} size={size * 0.55} />
  </span>
);
