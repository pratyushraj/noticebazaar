import { registerRoot, Composition } from 'remotion';
import { ScalingReel } from './ScalingReel';
import { BeforeAfterReel } from './BeforeAfterReel';

const Root = () => {
  return (
    <>
      <Composition
        id="ScalingReel"
        component={ScalingReel}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={630}
      />
      <Composition
        id="BeforeAfterReel"
        component={BeforeAfterReel}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={630}
      />
    </>
  );
};

registerRoot(Root);
