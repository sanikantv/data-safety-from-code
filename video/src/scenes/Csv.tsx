// "Then it fills Google's exact CSV template, and checks every answer."
// Rows are real rows of Google's template.
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { Card, Code, Em, Enter, Icon, Scene, Title } from '../ui';

const ROWS = [
  ['PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA', '', 'true'],
  ['PSL_DATA_TYPES_IDENTIFIERS', 'PSL_DEVICE_ID', 'true'],
  ['…:PSL_DEVICE_ID:PSL_DATA_USAGE_COLLECTION_AND_SHARING', 'PSL_DATA_USAGE_ONLY_SHARED', 'true'],
  ['…:PSL_DEVICE_ID:DATA_USAGE_COLLECTION_PURPOSE', 'PSL_ADVERTISING', 'true'],
  ['PSL_DATA_TYPES_APP_PERFORMANCE', 'PSL_CRASH_LOGS', 'true'],
  ['…:PSL_CRASH_LOGS:PSL_DATA_USAGE_EPHEMERAL', '', 'false'],
];
const FILL = 0.6;
const STEP = 0.32;

const Value = ({ i, v }: { readonly i: number; readonly v: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.floor(interpolate(frame, [(FILL + i * STEP) * fps, (FILL + i * STEP + 0.2) * fps], [0, v.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <span style={{ display: 'inline-block', width: 110, padding: '4px 0', textAlign: 'center', borderRadius: 12, background: chars ? C.primaryContainer : C.surfaceContainer }}>
      <Code size={28} color={C.onPrimaryContainer}>
        {v.slice(0, chars) || ' '}
      </Code>
    </span>
  );
};

export const Csv = () => (
  <Scene>
    <Enter>
      <Title>
        Google's exact template. <Em>Every answer checked.</Em>
      </Title>
    </Enter>
    <Enter delay={0.2}>
      <Card style={{ marginTop: 64, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '26px 40px', fontSize: 34, fontWeight: 700, borderBottom: `2px solid ${C.outlineVariant}` }}>
          <Icon name="table_view" size={40} color={C.primary} /> data_safety.csv
          <span style={{ marginLeft: 'auto', fontSize: 26, fontWeight: 500, color: C.onSurfaceVariant }}>782 rows · only the value column changes</span>
        </div>
        {ROWS.map(([q, r, v], i) => (
          <div key={q + r} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 40px', borderTop: i ? `1px solid ${C.surfaceHigh}` : undefined }}>
            <span style={{ flex: 1.5 }}>
              <Code size={26}>{q}</Code>
            </span>
            <span style={{ flex: 1 }}>
              <Code size={26}>{r}</Code>
            </span>
            <Value i={i} v={v} />
          </div>
        ))}
      </Card>
    </Enter>
    <Enter delay={FILL + ROWS.length * STEP + 0.3}>
      <div style={{ marginTop: 36, display: 'inline-flex', alignItems: 'center', gap: 18, padding: '20px 36px', borderRadius: 999, background: C.primary, color: C.onPrimary, fontSize: 38, fontWeight: 700 }}>
        <Icon name="check_circle" size={44} fill /> validate.py · 0 errors
      </div>
    </Enter>
  </Scene>
);
