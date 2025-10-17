import Motion from '@/app/components/containers/Motion'
import { selectUser } from '@/app/features/userSlice'
import Link from 'next/link'
import { useSelector } from 'react-redux'

const NavLinks = ({ type, onClose }) => {
    const user = useSelector(selectUser)
    const isSidebar = type === "sidebar"

    const links = [
        ...(user?.is_admin ? [{ href: '/administration/submitted-artists', label: 'Admin' }] : []),
        { href: '/events', label: 'Events' },
        { href: '/clubs', label: 'Clubs' },
        { href: '/news', label: 'News' },
    ]

    const handleLinkClick = () => {
        if (onClose) {
            onClose()
        }
    }

    return (
        <div className={`flex items-center gap-2 w-fit font-bold uppercase *:text-chino *:hover:text-cream *:duration-300 ${
            isSidebar ? 'flex-col text-3xl gap-2' : ''
        }`}>
            {links.map((link, index) => (
                <Motion
                    key={link.href}
                    animation={isSidebar ? "left" : "fade"}
                    delay={isSidebar ? index * 0.15 : 0.4}
                >
                    <Link 
                        href={link.href}
                        onClick={handleLinkClick}
                    >
                        {link.label}
                    </Link>
                </Motion>
            ))}
        </div>
    )
}

export default NavLinks