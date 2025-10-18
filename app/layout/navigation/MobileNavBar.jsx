"use client"
import {motion} from "framer-motion"
import { useSelector } from 'react-redux'
import {  selectUser } from '@/app/features/userSlice'
import DisplayName from "./components/userPanel/DisplayName"

const MobileNavBar = () => {
  const user = useSelector(selectUser)

  return (
    <div className="fixed bottom-2 z-[20] left-0 w-full lg:hidden px-4">
      <motion.section initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 , delay: 0.5}} className="bg-gold/20 backdrop-blur-sm rounded-full py-1 px-3 flex justify-end">
            <DisplayName type="mobile" user={user} />
      </motion.section>
    </div>
  )
}

export default MobileNavBar