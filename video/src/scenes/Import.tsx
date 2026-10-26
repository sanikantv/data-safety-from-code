// "Review the report, with a file and line for each answer, then import it in Play Console."
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { Card, Code, Em, Enter, Icon, Scene, Title } from '../ui';

const EVIDENCE = [
  { type: 'Device or other IDs', why: 'AdMob · vendor disclosure', where: 'build.gradle.kts:17' },
  { type: 'Crash logs', why: 'Firebase Crashlytics', where: 'libs.versions.toml:12' },
  { type: 'Approximate location', why: 'sent to your weather API', where: 'WeatherRepo.kt:42' },
];
const PRESS = 3.4;

const ImportButton = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const press = interpolate(frame, [PRESS * fps, (PRESS + 0.12) * fps, (PRESS + 0.3) * fps], [1, 0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 16, padding: '24px 40px', borderRadius: press < 1 ? 24 : 999,
        background: C.primary, color: C.onPrimary, fontSize: 38, fontWeight: 700, scale: press,
      }}
    >
      <Icon name="upload_file" size={44} /> Import to CSV
    </span>
  );
};

export const Import = () => (
  <Scene>
    <Enter>
      <Title>
        Review the evidence. <Em>Import.</Em>
      </Title>
    </Enter>
    <div style={{ display: 'flex', gap: 48, marginTop: 64, alignItems: 'stretch' }}>
      <Enter delay={0.2} from="left" style={{ flex: 1.35 }}>
        <Card style={{ height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 700 }}>
            <Icon name="description" size={40} color={C.primary} /> data_safety_report.md
          </div>
          {EVIDENCE.map((e, i) => (
            <Enter key={e.type} delay={0.6 + i * 0.4}>
              <div style={{ marginTop: 26, paddingLeft: 24, borderLeft: `6px solid ${C.primaryContainer}` }}>
                <div style={{ fontSize: 38, fontWeight: 700 }}>{e.type}</div>
                <div style={{ fontSize: 28, color: C.onSurfaceVariant, marginTop: 4 }}>
                  {e.why} · <Code size={26} color={C.primary}>{e.where}</Code>
                </div>
              </div>
            </Enter>
          ))}
        </Card>
      </Enter>
      <Enter delay={2.2} from="right" style={{ flex: 1 }}>
        <Card style={{ height: '100%', background: C.surfaceLow, display: 'grid', alignContent: 'center', justifyItems: 'start', gap: 36 }}>
          <div style={{ fontSize: 30, color: C.onSurfaceVariant, fontWeight: 600 }}>App content › Data safety</div>
          <ImportButton />
          <Enter delay={PRESS + 0.3} from="scale">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '16px 28px', borderRadius: 20, background: C.surfaceLowest, border: `2px solid ${C.outlineVariant}`, fontSize: 32, fontWeight: 600 }}>
              <Icon name="table_view" size={38} color={C.primary} /> data_safety.csv
              <Icon name="check" size={38} color={C.primary} />
            </div>
          </Enter>
        </Card>
      </Enter>
    </div>
  </Scene>
);
