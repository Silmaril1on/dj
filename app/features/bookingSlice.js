import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  artistData: null,
  loading: false,
  error: null,
  // Accept booking modal state
  acceptModal: {
    isOpen: false,
    bookingData: null,
    loading: false,
    error: null,
  },
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    openBookingModal: (state, action) => {
      state.isOpen = true;
      state.artistData = action.payload;
      state.error = null;
    },
    closeBookingModal: (state) => {
      state.isOpen = false;
      state.artistData = null;
      state.loading = false;
      state.error = null;
    },
    setBookingLoading: (state, action) => {
      state.loading = action.payload;
    },
    setBookingError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    // Accept booking modal actions
    openAcceptBookingModal: (state, action) => {
      state.acceptModal.isOpen = true;
      state.acceptModal.bookingData = action.payload;
      state.acceptModal.error = null;
    },
    closeAcceptBookingModal: (state) => {
      state.acceptModal.isOpen = false;
      state.acceptModal.bookingData = null;
      state.acceptModal.loading = false;
      state.acceptModal.error = null;
    },
    setAcceptBookingLoading: (state, action) => {
      state.acceptModal.loading = action.payload;
    },
    setAcceptBookingError: (state, action) => {
      state.acceptModal.error = action.payload;
      state.acceptModal.loading = false;
    },
  },
});

export const {
  openBookingModal,
  closeBookingModal,
  setBookingLoading,
  setBookingError,
  openAcceptBookingModal,
  closeAcceptBookingModal,
  setAcceptBookingLoading,
  setAcceptBookingError,
} = bookingSlice.actions;

export const selectBookingModal = (state) => state.booking;
export const selectAcceptBookingModal = (state) => state.booking.acceptModal;

export default bookingSlice.reducer;