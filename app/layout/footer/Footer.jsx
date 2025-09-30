"use client"
import { useDispatch } from 'react-redux'
import { openReportModal } from '@/app/features/reportsSlice'
import { appSocialLinks } from '@/app/localDB/pageInfoData';
import SocialLinks from '@/app/components/materials/SocialLinks';
import Paragraph from '@/app/components/ui/Paragraph';
import FlexBox from '@/app/components/containers/FlexBox';

const Footer = () => {
  const dispatch = useDispatch();

  return (
    <div className="center flex-col gap-2 py-5">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 bg-stone-900 p-5">
        <div></div>
        <div className="flex flex-col items-end *:w-fit *:text-2xl *:text-gold *:hover:text-cream *:duration-300 *:cursor-pointer font-bold uppercase">
          <h1>contact us</h1>
          <h1 onClick={() => dispatch(openReportModal("feedback"))}>
            feedback
          </h1>
          <h1 onClick={() => dispatch(openReportModal("bug"))}>report bug</h1>
        </div>
      </div>
      <FlexBox type="row-between" className="w-full items-center px-4 mt-4">
        <Paragraph text="© 2024 DJ App. All rights reserved." />
        <SocialLinks social_links={appSocialLinks} />
      </FlexBox>
    </div>
  );
}

export default Footer