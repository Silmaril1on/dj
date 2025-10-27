import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  requests: [],
  loading: false,
};

const eventRequestSlice = createSlice({
  name: "eventRequest",
  initialState,
  reducers: {
    openEventRequestModal: (state, action) => {
      state.isOpen = true;
      state.requests = action.payload.requests || [];
    },
    closeEventRequestModal: (state) => {
      state.isOpen = false;
      state.requests = [];
    },
    setEventRequests: (state, action) => {
      state.requests = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    removeRequest: (state, action) => {
      state.requests = state.requests.filter(
        (req) => req.id !== action.payload
      );
    },
  },
});

export const {
  openEventRequestModal,
  closeEventRequestModal,
  setEventRequests,
  setLoading,
  removeRequest,
} = eventRequestSlice.actions;

export const selectEventRequestModal = (state) => state.eventRequest;

export default eventRequestSlice.reducer;
