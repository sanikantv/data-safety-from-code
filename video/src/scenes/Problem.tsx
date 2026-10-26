// "Every app on Google Play needs a Data safety form. And most of the answers are about SDKs you didn't write."
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { Card, Em, Enter, Icon, Scene, Title } from '../ui';

// Labels from Google's Data safety CSV template.
const TYPES = [
  'Name', 'Email address', 'User IDs', 'Address', 'Phone number', 'Purchase history', 'Approximate location',
  'Precise location', 'Emails', 'Photos', 'Videos', 'Voice or sound recordings', 'Contacts', 'Calendar events',
  'Crash logs', 'Diagnostics', 'Files and docs', 'App interactions', 'In-app search history', 'Installed apps',
  'Other user-generated content', 'Device or other IDs',
];
const SDKS = ['AdMob', 'Firebase Analytics', 'Crashlytics', 'RevenueCat'];

const ScrollingForm = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Card style={{ width: 560, height: 840, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '30px 36px', borderBottom: `2px solid ${C.outlineVariant}`, fontSize: 30, fontWeight: 700 }}>
        Data safety
        <div style={{ fontSize: 24, fontWeight: 500, color: C.onSurfaceVariant, marginTop: 6 }}>Data types · select all that apply</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ translate: `0 ${-interpolate(frame, [0, 7 * fps], [0, 560])}px` }}>
        {TYPES.map((t) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 36px', fontSize: 30 }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: `3px solid ${C.onSurfaceVariant}` }} />
            {t}
          </div>
        ))}
      </div>
      </div>
    </Card>
  );
};

export const Problem = () => (
  <Scene style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ maxWidth: 860 }}>
      <Enter>
        <Title size={136}>782 answers.</Title>
      </Enter>
      <Enter delay={0.4}>
        <div style={{ fontSize: 60, fontWeight: 500, color: C.onSurfaceVariant, marginTop: 24 }}>possible in Google Play's Data safety form</div>
      </Enter>
      <Enter delay={3}>
        <div style={{ fontSize: 60, fontWeight: 700, marginTop: 72, lineHeight: 1.15 }}>
          Most are about <Em>SDKs you didn't write.</Em>
        </div>
      </Enter>
    </div>
    <div style={{ position: 'relative' }}>
      <ScrollingForm />
      {SDKS.map((s, i) => (
        <Enter key={s} delay={3.3 + i * 0.25} from="scale" style={{ position: 'absolute', left: i % 2 ? 220 : -40, top: 150 + i * 150 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 14, padding: '18px 30px', borderRadius: 999,
              background: C.tertiaryContainer, color: C.onTertiaryContainer, fontSize: 36, fontWeight: 700,
              boxShadow: '0 6px 24px rgb(0 0 0 / 0.12)',
            }}
          >
            <Icon name="inventory_2" size={36} /> {s}
          </span>
        </Enter>
      ))}
    </div>
  </Scene>
);
