import UserPanel from './components/userPanel/UserPanel'
import NavLinks from './components/NavLinks'
import Logo from '@/app/components/ui/Logo'
import SearchBar from '@/app/components/forms/SearchBar'
import BurgerMenu from '../side-bar/BurgerMenu'
import { useSelector } from 'react-redux'
import { selectUser } from '@/app/features/userSlice'
import AuthButtons from '@/app/components/buttons/AuthButtons'

const Navigation = () => {

  const user = useSelector(selectUser)

  return (
    <div className=" flex justify-between px-3 py-2 items-center relative">
      <BurgerMenu />
      <div className='lg:hidden'>
        {user ? (
          <div className="absolute right-0 top-0 flex lg:hidden">
            <Logo size="xs"  />
          </div>
        ) : (
          <AuthButtons size="small" />
        )}
      </div>
      <div className="hidden lg:flex items-center space-x-5 justify-start w-2/4">
        <Logo />
        <NavLinks />
        <SearchBar />
      </div>
        <UserPanel />
    </div>
  );
}

export default Navigation