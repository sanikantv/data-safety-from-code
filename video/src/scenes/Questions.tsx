// "It only asks what the code can't show. Like your deletion policy."
import { C } from '../theme';
import { Em, Enter, Icon, Scene, Title } from '../ui';

const QUESTIONS = [
  { icon: 'delete', text: 'Can users ask for their data to be deleted?', focus: true },
  { icon: 'policy', text: "What's your privacy policy URL?", focus: false },
  { icon: 'cloud_upload', text: 'Does your backend share data with third parties?', focus: false },
];

export const Questions = () => (
  <Scene style={{ justifyContent: 'center' }}>
    <Enter>
      <Title size={110}>
        Asks only what <Em>code can't show</Em>
      </Title>
    </Enter>
    <div style={{ display: 'grid', gap: 28, marginTop: 72, justifyItems: 'start' }}>
      {QUESTIONS.map((q, i) => (
        <Enter key={q.text} delay={0.5 + i * 0.3} from="left">
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 22, padding: '26px 40px', borderRadius: 999, fontSize: 46, fontWeight: 600,
              background: q.focus ? C.primaryContainer : C.surfaceContainer,
              color: q.focus ? C.onPrimaryContainer : C.onSurface,
            }}
          >
            <Icon name={q.icon} size={50} /> {q.text}
          </span>
        </Enter>
      ))}
    </div>
  </Scene>
);
