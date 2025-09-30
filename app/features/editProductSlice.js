import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  type: null,         // "event", "artist", "club"
  initialData: null,  // The data to edit
};

const editProductSlice = createSlice({
  name: "editProduct",
  initialState,
  reducers: {
    openEditProductModal: (state, action) => {
      state.isOpen = true;
      state.type = action.payload.type;
      state.initialData = action.payload.initialData;
    },
    closeEditProductModal: (state) => {
      state.isOpen = false;
      state.type = null;
      state.initialData = null;
    },
  },
});

export const { openEditProductModal, closeEditProductModal } = editProductSlice.actions;
export default editProductSlice.reducer;
export const selectEditProductModal = (state) => state.editProduct;