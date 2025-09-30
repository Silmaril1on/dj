import FlexBox from '../../components/containers/FlexBox'
import UserPanel from './components/userPanel/UserPanel'
import NavLinks from './components/NavLinks'
import Logo from '@/app/components/ui/Logo'

const Navigation = () => {

  return (
    <div className="flex items-center justify-between px-4 py-2 ">
      <FlexBox>
        <Logo />
        <NavLinks />
      </FlexBox>
      <FlexBox type="row-center" className="gap-2 py-1">
        <UserPanel />
      </FlexBox>
    </div>
  );
}

export default Navigation