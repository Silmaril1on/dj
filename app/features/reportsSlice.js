import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  type: null, // "bug" or "feedback"
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    openReportModal: (state, action) => {
      state.isOpen = true;
      state.type = action.payload; 
    },
    closeReportModal: (state) => {
      state.isOpen = false;
      state.type = null;
    },
  },
});

export const { openReportModal, closeReportModal } = reportsSlice.actions;
export const selectReportsModal = (state) => state.reports;
export default reportsSlice.reducer;