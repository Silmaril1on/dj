import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  userName: "",
  email: "",
};

const welcomeSlice = createSlice({
  name: "welcome",
  initialState,
  reducers: {
    openWelcomeModal: (state, action) => {
      state.isOpen = true;
      state.userName = action.payload.userName;
      state.email = action.payload.email;
    },
    closeWelcomeModal: (state) => {
      state.isOpen = false;
      state.userName = "";
      state.email = "";
    },
  },
});

export const { openWelcomeModal, closeWelcomeModal } = welcomeSlice.actions;
export const selectWelcomeModal = (state) => state.welcome;
export default welcomeSlice.reducer;
