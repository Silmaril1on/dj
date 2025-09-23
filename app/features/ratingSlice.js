import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ratingModal: {
    isOpen: false,
    artistId: null,
    name: "",
    stage_name: "",
    currentRating: 0,
    userRating: null,
    averageScore: 0,
    totalRatings: 0,
  },
  // Store user ratings for immediate UI updates
  userRatings: {}, // { artistId: rating }
  // Store rating statistics for immediate UI updates
  ratingStats: {}, // { artistId: { average_score, total_ratings } }
};

const ratingSlice = createSlice({
  name: "rating",
  initialState,
  reducers: {
    openRatingModal: (state, action) => {
      const {
        artistId,
        name,
        stage_name,
        currentRating,
        userRating,
        averageScore,
        totalRatings,
      } = action.payload;
      state.ratingModal = {
        isOpen: true,
        artistId,
        name,
        stage_name,
        currentRating,
        userRating,
        averageScore: averageScore || 0,
        totalRatings: totalRatings || 0,
      };
    },
    closeRatingModal: (state) => {
      state.ratingModal = {
        isOpen: false,
        artistId: null,
        name: "",
        stage_name: "",
        currentRating: 0,
        userRating: null,
        averageScore: 0,
        totalRatings: 0,
      };
    },
    setRatingModalRating: (state, action) => {
      state.ratingModal.currentRating = action.payload;
    },
    updateUserRating: (state, action) => {
      const { artistId, rating } = action.payload;
      state.userRatings[artistId] = rating;
    },
    clearUserRating: (state, action) => {
      const { artistId } = action.payload;
      delete state.userRatings[artistId];
    },
    updateRatingStats: (state, action) => {
      const { artistId, average_score, total_ratings } = action.payload;
      state.ratingStats[artistId] = { average_score, total_ratings };
    },
    clearRatingStats: (state, action) => {
      const { artistId } = action.payload;
      delete state.ratingStats[artistId];
    },
    clearAllRatings: (state) => {
      state.userRatings = {};
      state.ratingStats = {};
      state.ratingModal = {
        isOpen: false,
        artistId: null,
        name: "",
        stage_name: "",
        currentRating: 0,
        userRating: null,
        averageScore: 0,
        totalRatings: 0,
      };
    },
  },
});

export const {
  openRatingModal,
  closeRatingModal,
  setRatingModalRating,
  updateUserRating,
  clearUserRating,
  updateRatingStats,
  clearRatingStats,
  clearAllRatings,
} = ratingSlice.actions;

export const ratingReducer = ratingSlice.reducer;

export const selectRatingModal = (state) => state.rating.ratingModal;
export const selectUserRatings = (state) => state.rating.userRatings;
export const selectUserRating = (artistId) => (state) =>
  state.rating.userRatings[artistId] || null;
export const selectRatingStats = (state) => state.rating.ratingStats;
export const selectArtistRatingStats = (artistId) => (state) =>
  state.rating.ratingStats[artistId] || null;
