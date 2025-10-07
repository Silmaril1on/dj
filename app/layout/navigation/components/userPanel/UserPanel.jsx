"use client"
import AuthButtons from '@/app/components/buttons/AuthButtons'
import { clearUser, selectIsAuthenticated, selectUser } from '@/app/features/userSlice'
import { clearAllRatings } from '@/app/features/ratingSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useState, useRef, useEffect } from 'react'
import { removeUserCookie } from '@/app/helpers/cookieUtils'
import { supabaseClient } from '@/app/lib/config/supabaseClient'
import DisplayName from './DisplayName'
import { useRouter } from 'next/navigation'

const UserPanel = () => {
    const user = useSelector(selectUser)
    const isAuthenticated = useSelector(selectIsAuthenticated)
    const dispatch = useDispatch()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const settingsRef = useRef(null)
    const router = useRouter()

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await supabaseClient.auth.signOut()
            dispatch(clearUser())
            dispatch(clearAllRatings())
            setIsSettingsOpen(false)
            removeUserCookie()
            router.push("/")
        } catch (error) {
            router.push("/")
            console.error('Logout error:', error)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            // Check for redirect parameter in URL
            const urlParams = new URLSearchParams(window.location.search)
            const redirect = urlParams.get("redirect")
            if (redirect && redirect !== "/sign-in" && redirect !== "/sign-up") {
                router.push(redirect)
            }
        }
    }, [isAuthenticated, router])

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen)
    }

    return (
        <div>
            {isAuthenticated ? (
                <DisplayName
                    user={user}
                    isSettingsOpen={isSettingsOpen}
                    settingsRef={settingsRef}
                    toggleSettings={toggleSettings}
                    handleLogout={handleLogout}
                />
            ) : (
                <AuthButtons />
            )}
        </div>
    )
}

export default UserPanel
