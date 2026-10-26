// "Each SDK is matched to its vendor's own disclosure. AdMob? Device IDs, shared for advertising."
// Rows match the AdMob entry in skills/data-safety-from-code/knowledge/sdks.yaml.
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { Badge, Card, Code, Em, Enter, Icon, IconTile, Scene, Title } from '../ui';

const ROWS = [
  { icon: 'smartphone', type: 'Device or other IDs' },
  { icon: 'touch_app', type: 'App interactions' },
  { icon: 'location_on', type: 'Approximate location' },
  { icon: 'monitoring', type: 'Diagnostics' },
];
const FOCUS = 4.6; // "Device IDs, shared for advertising"

const Row = ({ icon, type, first }: { readonly icon: string; readonly type: string; readonly first: boolean }) => {
  // AdMob's disclosure gives the same purposes for all four types.
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [FOCUS * fps, (FOCUS + 0.4) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 24, padding: '20px 24px', borderRadius: 28,
        background: first ? `rgb(169 242 205 / ${t})` : 'transparent',
        opacity: first ? 1 : interpolate(t, [0, 1], [1, 0.45]),
        scale: first ? interpolate(t, [0, 1], [1, 1.03]) : undefined,
      }}
    >
      <IconTile name={icon} size={68} />
      <span style={{ flex: 1, display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 700, whiteSpace: 'nowrap' }}>{type}</span>
        <span style={{ fontSize: 26, fontWeight: 500, color: C.primary }}>Advertising · Analytics · Fraud prevention</span>
      </span>
      <Badge tone="tertiary">Collected + shared</Badge>
    </div>
  );
};

export const Sdks = () => (
  <Scene>
    <Enter>
      <Title>
        Every SDK, matched to <Em>its vendor's disclosure</Em>
      </Title>
    </Enter>
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 64 }}>
      <Enter delay={0.3} from="left">
        <Card style={{ width: 430, padding: 34 }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: C.onSurfaceVariant }}>build.gradle.kts</div>
          <div style={{ marginTop: 18 }}>
            <Code size={27} color={C.onSurface}>
              implementation(
              <br />
              &nbsp;&nbsp;"com.google.android.gms:
              <br />
              &nbsp;&nbsp;play-services-ads")
            </Code>
          </div>
          <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 40, fontWeight: 800, color: C.primary }}>
            <Icon name="inventory_2" size={44} /> AdMob
          </div>
        </Card>
      </Enter>
      <Enter delay={1.1} from="scale">
        <Icon name="arrow_forward" size={64} color={C.primary} />
      </Enter>
      <Enter delay={1.4} from="right" style={{ flex: 1 }}>
        <Card style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 16px 18px', fontSize: 30, fontWeight: 600, color: C.onSurfaceVariant }}>
            <Icon name="policy" size={36} color={C.primary} /> Vendor disclosure · developers.google.com
          </div>
          {ROWS.map((r, i) => (
            <Row key={r.type} icon={r.icon} type={r.type} first={i === 0} />
          ))}
        </Card>
      </Enter>
    </div>
  </Scene>
);
