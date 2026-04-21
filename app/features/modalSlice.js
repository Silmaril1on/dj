import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isDarkMode: true,
  error: "",
  errorType: "error",
  errorAction: null,
  addEventModal: {
    isOpen: false,
    artist: null,
    eventData: null, // For editing existing events
    isEditMode: false,
  },
  addAlbumModal: {
    isOpen: false,
    artist: null,
    albumData: null,
    isEditMode: false,
  },
  addClubDateModal: {
    isOpen: false,
    club: null,
    eventData: null,
    isEditMode: false,
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
      const {
        message,
        type,
        action: errorAction,
      } = typeof action.payload === "string"
        ? { message: action.payload, type: "error", action: null }
        : action.payload;
      state.error = message;
      state.errorType = type || "error";
      state.errorAction = errorAction || null;
    },
    openAddEventModal: (state, action) => {
      state.addEventModal = {
        isOpen: true,
        artist: action.payload.artist,
        eventData: action.payload.eventData || null,
        isEditMode: !!action.payload.eventData,
        clubId: action.payload.clubId || null,
      };
    },
    closeAddEventModal: (state) => {
      state.addEventModal = {
        isOpen: false,
        artist: null,
        eventData: null,
        isEditMode: false,
        clubId: null,
      };
    },
    openAddAlbumModal: (state, action) => {
      state.addAlbumModal = {
        isOpen: true,
        artist: action.payload.artist,
        albumData: action.payload.albumData || null,
        isEditMode: !!action.payload.albumData,
      };
    },
    closeAddAlbumModal: (state) => {
      state.addAlbumModal = {
        isOpen: false,
        artist: null,
        albumData: null,
        isEditMode: false,
      };
    },
    openAddClubDateModal: (state, action) => {
      state.addClubDateModal = {
        isOpen: true,
        club: action.payload.club,
        eventData: action.payload.eventData || null,
        isEditMode: !!action.payload.eventData,
      };
    },
    closeAddClubDateModal: (state) => {
      state.addClubDateModal = {
        isOpen: false,
        club: null,
        eventData: null,
        isEditMode: false,
      };
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setError,
  openAddEventModal,
  closeAddEventModal,
  openAddAlbumModal,
  closeAddAlbumModal,
  openAddClubDateModal,
  closeAddClubDateModal,
} = modalSlice.actions;

export const modalReducer = modalSlice.reducer;

// Selectors
export const selectIsDarkMode = (state) => state.modal.isDarkMode;
export const selectError = (state) => state.modal.error;
export const selectErrorType = (state) => state.modal.errorType;
export const selectErrorAction = (state) => state.modal.errorAction;
export const selectAddEventModal = (state) => state.modal.addEventModal;
export const selectAddAlbumModal = (state) => state.modal.addAlbumModal;
export const selectAddClubDateModal = (state) => state.modal.addClubDateModal;
