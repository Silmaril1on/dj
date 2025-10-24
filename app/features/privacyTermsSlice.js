import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  type: null, // 'general', 'privacy', 'artist', 'club', 'event'
};

const privacyTermsSlice = createSlice({
  name: "privacyTerms",
  initialState,
  reducers: {
    openPrivacyTermsModal: (state, action) => {
      state.isOpen = true;
      state.type = action.payload; // 'general', 'privacy', etc.
    },
    closePrivacyTermsModal: (state) => {
      state.isOpen = false;
      state.type = null;
    },
  },
});

export const { openPrivacyTermsModal, closePrivacyTermsModal } = privacyTermsSlice.actions;
export const selectPrivacyTermsModal = (state) => state.privacyTerms;
export const privacyTermsReducer = privacyTermsSlice.reducer;
