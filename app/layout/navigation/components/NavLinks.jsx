import Link from 'next/link'
import React from 'react'

const NavLinks = () => {
    return (
        <div className='flex items-center gap-2 mx-5'>
            <Link href="/administration/submitted-artists" className='italic'>Administration</Link>
            <Link href="/events" className='italic'>Events</Link>
        </div>
    )
}

export default NavLinks