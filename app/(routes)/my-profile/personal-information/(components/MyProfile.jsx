"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/app/lib/hooks/useUserProfile";
import UserProfileForm from "./UserProfileForm";
import UserProfile from "./UserProfile";

const MyProfile = ({ initialProfile }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const { profile } = useUserProfile(initialProfile);

  return (
    <div className="space-y-8">
      <UserProfile
        profile={profile}
        onUpdateClick={() => setShowEditForm((v) => !v)}
        isEditing={showEditForm}
      />
      <AnimatePresence>
        {showEditForm && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <UserProfileForm
              profile={profile}
              onCancel={() => setShowEditForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyProfile;
