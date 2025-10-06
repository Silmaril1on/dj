import { selectUser } from '@/app/features/userSlice'
import Link from 'next/link'
import { useSelector } from 'react-redux'

const NavLinks = () => {
    const user = useSelector(selectUser)


    return (
        <div className='flex items-center gap-2 w-fit font-bold uppercase *:text-chino *:hover:text-cream *:duration-300'>
            {user?.is_admin && <Link href="/administration/submitted-artists">Admin</Link>}
            <Link href="/events">Events</Link>
            <Link href="/clubs">Clubs</Link>
            <Link href="/news">News</Link>
        </div>
    )
}

export default NavLinks 