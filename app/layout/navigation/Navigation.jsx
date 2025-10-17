import UserPanel from './components/userPanel/UserPanel'
import NavLinks from './components/NavLinks'
import Logo from '@/app/components/ui/Logo'
import SearchBar from '@/app/components/forms/SearchBar'
import BurgerMenu from '../side-bar/BurgerMenu'

const Navigation = () => {

  return (
    <div className="grid grid-cols-2 p-3 items-center">
      <BurgerMenu /> 
      <div className='hidden lg:flex items-center space-x-5 justify-start'>
        <Logo />
        <NavLinks />
        <SearchBar />
      </div>
      <div className="justify-end flex items-center">
        <UserPanel />
      </div>
    </div>
  );
}

export default Navigation