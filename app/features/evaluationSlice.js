import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isEvaluationModalOpen: false,
  selectedArtist: null,
  artistData: null,
  loading: false,
  error: null,
};

const evaluationSlice = createSlice({
  name: "evaluation",
  initialState,
  reducers: {
    openEvaluationModal: (state, action) => {
      state.isEvaluationModalOpen = true;
      state.selectedArtist = action.payload;
      state.artistData = null;
      state.error = null;
    },
    closeEvaluationModal: (state) => {
      state.isEvaluationModalOpen = false;
      state.selectedArtist = null;
      state.artistData = null;
      state.error = null;
    },
    setArtistData: (state, action) => {
      state.artistData = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  openEvaluationModal,
  closeEvaluationModal,
  setArtistData,
  setLoading,
  setError,
} = evaluationSlice.actions;

export const selectEvaluationModal = (state) =>
  state.evaluation.isEvaluationModalOpen;
export const selectSelectedArtist = (state) => state.evaluation.selectedArtist;
export const selectArtistData = (state) => state.evaluation.artistData;
export const selectEvaluationLoading = (state) => state.evaluation.loading;
export const selectEvaluationError = (state) => state.evaluation.error;

export default evaluationSlice.reducer;
