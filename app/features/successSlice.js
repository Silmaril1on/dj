import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  type: null,
  data: {
    image: "",
    name: "",
    stage_name: "",
    country: "",
    city: "",
  },
};

const successSlice = createSlice({
  name: "success",
  initialState,
  reducers: {
    showSuccess: (state, action) => {
      state.isOpen = true;
      state.type = action.payload.type;
      state.data = {
        image: action.payload.image || "",
        name: action.payload.name || "",
        stage_name: action.payload.stage_name || "",
        country: action.payload.country || "",
        city: action.payload.city || "",
      };
    },
    hideSuccess: (state) => {
      state.isOpen = false;
      state.type = null;
      state.data = {
        image: "",
        name: "",
        stage_name: "",
        country: "",
        city: "",
      };
    },
  },
});

export const { showSuccess, hideSuccess } = successSlice.actions;
export const selectSuccess = (state) => state.success;
export default successSlice.reducer;
