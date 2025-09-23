import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, updateUserProfile, clearUser, setLoading } =
  userSlice.actions;

export const userReducer = userSlice.reducer;

// Selectors
export const selectUser = (state) => state.user.user;
export const selectUserProfile = (state) => state.user.user;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectIsLoading = (state) => state.user.isLoading;
