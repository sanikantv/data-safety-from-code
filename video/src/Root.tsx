import { Composition } from 'remotion';
import { FPS, IntroVideo, totalFrames } from './IntroVideo';
import './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="Intro" component={IntroVideo} durationInFrames={totalFrames(FPS)} fps={FPS} width={1920} height={1080} />
  );
};
