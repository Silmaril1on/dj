import Link from 'next/link'
import FlexBox from '../../components/containers/FlexBox'
import UserPanel from './components/userPanel/UserPanel'
import NavLinks from './components/NavLinks'

const Navigation = () => {

  return (
    <div className='flex items-center justify-between px-4 py-2 '>
      <Link href="/" className='text-2xl font-bold italic hover:tracking-wide duration-300'>DJDB</Link>
      <NavLinks />

      <FlexBox type="row-center" className="gap-2 py-1">
        <UserPanel />
      </FlexBox>
    </div>
  )
}

export default Navigation