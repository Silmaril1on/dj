import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reviewModal: {
    isOpen: false,
    artistId: null,
    name: "",
    stage_name: "",
    isLowRating: false,
    rating: null,
    isEditMode: false,
    editReviewId: null,
    editReviewTitle: "",
    editReviewText: "",
  },
};

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    openReviewModal: (state, action) => {
      const {
        artistId,
        name,
        stage_name,
        isLowRating = false,
        rating = null,
        isEditMode = false,
        editReviewId = null,
        editReviewTitle = "",
        editReviewText = "",
      } = action.payload;
      state.reviewModal = {
        isOpen: true,
        artistId,
        name,
        stage_name,
        isLowRating,
        rating,
        isEditMode,
        editReviewId,
        editReviewTitle,
        editReviewText,
      };
    },
    closeReviewModal: (state) => {
      // Only toggle isOpen so content can fade out with GlobalModal
      state.reviewModal.isOpen = false;
    },
  },
});

export const { openReviewModal, closeReviewModal } = reviewsSlice.actions;

export const reviewsReducer = reviewsSlice.reducer;

// Selectors
export const selectReviewModal = (state) => state.reviews.reviewModal;
