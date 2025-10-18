"use client"
import AuthButtons from '@/app/components/buttons/AuthButtons'
import { selectIsAuthenticated, selectUser } from '@/app/features/userSlice'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DisplayName from './DisplayName'

const UserPanel = () => {
    const user = useSelector(selectUser)
    const isAuthenticated = useSelector(selectIsAuthenticated)
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) {
            const urlParams = new URLSearchParams(window.location.search)
            const redirect = urlParams.get("redirect")
            if (redirect && redirect !== "/sign-in" && redirect !== "/sign-up") {
                router.push(redirect)
            }
        }
    }, [isAuthenticated, router])

    return (
        <div className="hidden lg:flex">
            {isAuthenticated ? (
                <DisplayName user={user} />
            ) : (
                <AuthButtons />
            )}
        </div>
    )
}

export default UserPanel
