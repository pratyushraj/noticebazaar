import { Composition } from 'remotion';
import { CreatorPortfolio } from './CreatorPortfolio';
import { DentistShort } from './DentistShort';
import { CompTIAShort } from './CompTIAShort';
import { LocalBusinessReel } from './LocalBusinessReel';
import { TextMotionReel } from './TextMotionReel';
import { UnifiedClinicPitch } from './UnifiedClinicPitch';


export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="UnifiedClinicPitch"
        component={UnifiedClinicPitch}
        durationInFrames={900} // 30 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LocalBusinessReel"
        component={LocalBusinessReel}
        durationInFrames={900} // 30 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TextMotionReel"
        component={TextMotionReel}
        durationInFrames={900} // 30 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CompTIAReel"
        component={CompTIAShort}
        durationInFrames={453} // 15.1 seconds
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CreatorPortfolio"
        component={CreatorPortfolio}
        durationInFrames={450} // 15 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          creatorName: 'Kajal Yadav',
          handle: '@kajukatlivlogs',
          followers: '7.8K',
          avgViews: '33.8K',
          engagement: '5.6%',
          topCity: 'Patna (21%)',
          femaleRatio: '87.9%',
          starterRate: '₹4,000'
        }}
      />
      <Composition
        id="DentistReel"
        component={DentistShort}
        durationInFrames={450} // 15 seconds
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
