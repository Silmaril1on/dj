import FlexBox from '@/app/components/containers/FlexBox';
import Motion from '@/app/components/containers/Motion';
import Dot from '@/app/components/ui/Dot';
import Title from '@/app/components/ui/Title';
import React from 'react'

const Lineup = ({ title = "Lineup", data = [] }) => (
  <div className="px-3 mb-2 lg:px-4">
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

export default Lineup;