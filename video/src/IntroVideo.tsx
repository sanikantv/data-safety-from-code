// The full intro: one scene per voiceover clip, joined with short crossfades.
// Scene lengths come from src/timings.json, which scripts/voiceover.mjs writes after generating the audio.
import { Audio } from '@remotion/media';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Fragment } from 'react';
import { Sequence, staticFile, useVideoConfig } from 'remotion';
import timings from './timings.json';
import { Problem } from './scenes/Problem';
import { Intro } from './scenes/Intro';
import { Scan } from './scenes/Scan';
import { Sdks } from './scenes/Sdks';
import { Questions } from './scenes/Questions';
import { Csv } from './scenes/Csv';
import { Import } from './scenes/Import';
import { Cta } from './scenes/Cta';

export const FPS = 30;
const LEAD = 4; // frames of silence before each clip
const TAIL = 10; // frames after each clip ends
const FADE = 10;
const END_HOLD = 36;

const SCENES = { '01-problem': Problem, '02-intro': Intro, '03-scan': Scan, '04-sdks': Sdks, '05-questions': Questions, '06-csv': Csv, '07-import': Import, '08-cta': Cta };

export const sceneFrames = (fps: number) =>
  timings.map((t, i) => LEAD + Math.ceil(t.seconds * fps) + TAIL + (i === timings.length - 1 ? END_HOLD : 0));

export const totalFrames = (fps: number) => sceneFrames(fps).reduce((a, b) => a + b, 0) - FADE * (timings.length - 1);

export const IntroVideo = () => {
  const { fps } = useVideoConfig();
  const frames = sceneFrames(fps);
  return (
    <TransitionSeries>
      {timings.map((t, i) => {
        const SceneComponent = SCENES[t.id as keyof typeof SCENES];
        return (
          <Fragment key={t.id}>
            {i > 0 && <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />}
            <TransitionSeries.Sequence name={t.id} durationInFrames={frames[i]}>
              <SceneComponent />
              <Sequence from={LEAD} layout="none" name={`voice ${t.id}`}>
                <Audio src={staticFile(`voiceover/${t.id}.mp3`)} />
              </Sequence>
            </TransitionSeries.Sequence>
          </Fragment>
        );
      })}
    </TransitionSeries>
  );
};
