import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isDarkMode: true,
  error: "",
  errorType: "error",
  globalModal: {
    isOpen: false,
    content: null,
  },
  addEventModal: {
    isOpen: false,
    artist: null,
    eventData: null, // For editing existing events
    isEditMode: false,
  },
  addAlbumModal: {
    isOpen: false,
    artist: null,
  },
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem("theme", state.isDarkMode ? "dark" : "light");
    },
    setTheme: (state, action) => {
      state.isDarkMode = action.payload === "dark";
      localStorage.setItem("theme", state.isDarkMode ? "dark" : "light");
    },
    setError: (state, action) => {
      const { message, type } =
        typeof action.payload === "string"
          ? { message: action.payload, type: "error" }
          : action.payload;
      state.error = message;
      state.errorType = type || "error";
    },
    openGlobalModal: (state, action) => {
      state.globalModal = {
        isOpen: true,
        content: action.payload,
      };
    },
    closeGlobalModal: (state) => {
      state.globalModal = {
        isOpen: false,
        content: null,
      };
    },
    openAddEventModal: (state, action) => {
      state.addEventModal = {
        isOpen: true,
        artist: action.payload.artist,
        eventData: action.payload.eventData || null,
        isEditMode: !!action.payload.eventData,
      };
    },
    closeAddEventModal: (state) => {
      state.addEventModal = {
        isOpen: false,
        artist: null,
        eventData: null,
        isEditMode: false,
      };
    },
    openAddAlbumModal: (state, action) => {
      state.addAlbumModal = {
        isOpen: true,
        artist: action.payload.artist,
      };
    },
    closeAddAlbumModal: (state) => {
      state.addAlbumModal = {
        isOpen: false,
        artist: null,
      };
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setError,
  openGlobalModal,
  closeGlobalModal,
  openAddEventModal,
  closeAddEventModal,
  openAddAlbumModal,
  closeAddAlbumModal,
} = modalSlice.actions;

export const modalReducer = modalSlice.reducer;

// Selectors
export const selectIsDarkMode = (state) => state.modal.isDarkMode;
export const selectError = (state) => state.modal.error;
export const selectErrorType = (state) => state.modal.errorType;
export const selectGlobalModal = (state) => state.modal.globalModal;
export const selectAddEventModal = (state) => state.modal.addEventModal;
export const selectAddAlbumModal = (state) => state.modal.addAlbumModal;
