import UserPanel from './components/userPanel/UserPanel'
import NavLinks from './components/NavLinks'
import Logo from '@/app/components/ui/Logo'
import SearchBar from '@/app/components/forms/SearchBar'
import BurgerMenu from '../side-bar/BurgerMenu'

const Navigation = () => {

  return (
    <div className="flex justify-between py-1 px-2 items-center relative">
      <BurgerMenu />
       <div className=' w-full flex items-center lg:w-2/4 ml-2'>
        <div className="hidden lg:flex items-center space-x-3 justify-start mr-2 ">
            <Logo />
            <NavLinks />
        </div>
        <SearchBar />
        <div className="block lg:hidden">
          <Logo size="xs"  />
        </div>
      </div>
        <UserPanel />
    </div>
  );
}

export default Navigation