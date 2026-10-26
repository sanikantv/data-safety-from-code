// "Free and open source, at data safety dot sanikant dot dev."
import { Img, staticFile } from 'remotion';
import { C } from '../theme';
import { Code, Enter, Icon, Scene, Title } from '../ui';

export const Cta = () => (
  <Scene style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
    <Enter from="scale">
      <Img src={staticFile('icon.svg')} style={{ width: 180, height: 180 }} />
    </Enter>
    <Enter delay={0.2}>
      <Title size={150} style={{ marginTop: 40, color: C.primary }}>datasafety.sanikant.dev</Title>
    </Enter>
    <Enter delay={0.7}>
      <div style={{ marginTop: 48, display: 'inline-flex', alignItems: 'center', gap: 20, padding: '24px 40px', borderRadius: 28, background: C.surfaceHigh }}>
        <Icon name="terminal" size={44} color={C.onSurfaceVariant} />
        <Code size={40} color={C.onSurface}>npx skills add sanikantv/data-safety-from-code</Code>
      </div>
    </Enter>
    <Enter delay={1.2}>
      <div style={{ marginTop: 40, fontSize: 44, fontWeight: 600, color: C.onSurfaceVariant, display: 'inline-flex', alignItems: 'center', gap: 16 }}>
        <Icon name="star" size={48} color={C.primary} fill /> Free and open source · MIT · github.com/sanikantv
      </div>
    </Enter>
  </Scene>
);
