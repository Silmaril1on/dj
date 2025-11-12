import FlexBox from '@/app/components/containers/FlexBox';
import Motion from '@/app/components/containers/Motion';
import Dot from '@/app/components/ui/Dot';
import Title from '@/app/components/ui/Title';

const ProfileLineup = ({ title = "Lineup", data = [] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className='pl-2'>
      <Title text={title} size="sm" color="chino" className='font-normal' />
      <FlexBox type="row-start" className="flex-wrap gap-2 items-center">
        {data.map((artist, index) => (
          <Motion
            animation="fade"
            delay={index * 0.2}
            key={index}
            className="flex items-center space-x-2"
          >
            <Title size="xl" color="cream" className="uppercase leading-none" text={artist} />
            {index < data.length - 1 && <Dot />}
          </Motion>
        ))}
      </FlexBox>
    </div>
  );
};

export default ProfileLineup;
