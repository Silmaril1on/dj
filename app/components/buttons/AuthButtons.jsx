'use client';
import { motion } from 'framer-motion'
import Button from './Button';

const AuthButtons = ({size}) => {
    return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          viewport={{ once: true }}
          className="space-x-3 flex"
        >
          <Button size={size} text="Sign In" href="/sign-in" />
          <Button size={size} text="Sign Up" href="/sign-up" />
        </motion.div>
    );
}

export default AuthButtons