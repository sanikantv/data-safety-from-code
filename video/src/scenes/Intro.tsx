// "Meet data safety from code: an agent skill that fills it in from your code."
import { Img, staticFile } from 'remotion';
import { C } from '../theme';
import { Em, Enter, Scene, Title } from '../ui';

export const Intro = () => (
  <Scene style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
    <Enter from="scale">
      <Img src={staticFile('icon.svg')} style={{ width: 240, height: 240 }} />
    </Enter>
    <Enter delay={0.35}>
      <Title size={128} style={{ marginTop: 48 }}>data-safety-from-code</Title>
    </Enter>
    <Enter delay={1.6}>
      <div style={{ fontSize: 64, fontWeight: 500, color: C.onSurfaceVariant, marginTop: 32 }}>
        Your Data safety form, <Em>filled from your code</Em>
      </div>
    </Enter>
    <Enter delay={2.2}>
      <div style={{ marginTop: 48, display: 'inline-flex', gap: 16 }}>
        {['Open-source agent skill', 'Android', 'MIT'].map((t) => (
          <span key={t} style={{ padding: '12px 28px', borderRadius: 999, background: C.secondaryContainer, color: C.onSecondaryContainer, fontSize: 32, fontWeight: 600 }}>
            {t}
          </span>
        ))}
      </div>
    </Enter>
  </Scene>
);
