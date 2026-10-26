// "It reads your manifest, Gradle files and source, and finds every place where data leaves the device."
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { Badge, Card, Code, Em, Enter, Icon, IconTile, Scene, Title } from '../ui';

const FILES = [
  { icon: 'description', name: 'AndroidManifest.xml', indent: 1 },
  { icon: 'deployed_code', name: 'build.gradle.kts', indent: 1 },
  { icon: 'deployed_code', name: 'libs.versions.toml', indent: 1 },
  { icon: 'code', name: 'WeatherRepo.kt', indent: 2 },
  { icon: 'code', name: 'ApiClient.kt', indent: 2 },
];
const FINDINGS = [
  { icon: 'smartphone', what: 'play-services-ads', where: 'build.gradle.kts:17' },
  { icon: 'bug_report', what: 'firebase-crashlytics', where: 'libs.versions.toml:12' },
  { icon: 'location_on', what: 'location sent to your API', where: 'WeatherRepo.kt:42' },
  { icon: 'warning', what: 'plain http:// URL', where: 'ApiClient.kt:8' },
];
const START = 0.5;
const STEP = 0.75;

const Highlight = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const row = interpolate(frame, FILES.map((_, i) => (START + i * STEP) * fps), FILES.map((_, i) => i), {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute', left: 24, right: 24, height: 84, top: 104 + row * 92, borderRadius: 22,
        background: C.primaryContainer, opacity: interpolate(frame, [START * fps - 6, START * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}
    />
  );
};

export const Scan = () => (
  <Scene>
    <Enter>
      <Title>
        Reads your code. <Em>Finds where data leaves.</Em>
      </Title>
    </Enter>
    <div style={{ display: 'flex', gap: 56, marginTop: 72, alignItems: 'flex-start' }}>
      <Enter delay={0.15} from="left">
        <Card style={{ width: 660, position: 'relative', padding: '28px 24px' }}>
          <Highlight />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '6px 20px 26px', fontSize: 34, fontWeight: 700 }}>
            <Icon name="folder" size={40} color={C.primary} fill /> my-app
          </div>
          {FILES.map((f) => (
            <div key={f.name} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, height: 92, paddingLeft: 20 + f.indent * 36, fontSize: 34 }}>
              <Icon name={f.icon} size={38} color={C.onSurfaceVariant} /> {f.name}
            </div>
          ))}
        </Card>
      </Enter>
      <div style={{ flex: 1, display: 'grid', gap: 22 }}>
        {FINDINGS.map((f, i) => (
          <Enter key={f.what} delay={START + 0.5 + i * STEP} from="right">
            <Card style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '26px 32px', borderRadius: 32 }}>
              <IconTile name={f.icon} size={72} tone={f.icon === 'warning' ? 'tertiary' : 'primary'} />
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>{f.what}</span>
                <Code size={28} color={C.primary}>{f.where}</Code>
              </div>
              <span style={{ marginLeft: 'auto' }}>
                <Badge>evidence</Badge>
              </span>
            </Card>
          </Enter>
        ))}
      </div>
    </div>
  </Scene>
);
