import FlexBox from '../../components/containers/FlexBox'
import UserPanel from './components/userPanel/UserPanel'
import NavLinks from './components/NavLinks'
import Logo from '@/app/components/ui/Logo'
import SearchBar from '@/app/components/forms/SearchBar'

const Navigation = () => {

  return (
    <div className="grid grid-cols-2 px-4 items-center py-2">
      <div className='flex items-center space-x-5 justify-start'>
        <Logo />
        <NavLinks />
        <SearchBar />
      </div>
      <FlexBox type="row-center" className="justify-end">
        <UserPanel />
      </FlexBox>
    </div>
  );
}

export default Navigation