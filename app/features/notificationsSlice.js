import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchNotificationsThunk = createAsyncThunk(
  "notifications/fetch",
  async (userId, { getState, rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notifications?user_id=${userId}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return rejectWithValue(err.error || "Failed to fetch notifications");
      }
      const data = await response.json();
      return data.notifications || [];
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
  {
    // Skip if already fetched (prevents duplicate calls from multiple component instances)
    condition: (_, { getState }) => {
      const { fetched, loading } = getState().notifications;
      return !fetched && !loading;
    },
  },
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    loading: false,
    error: null,
    fetched: false,
  },
  reducers: {
    markAllReadLocally: (state) => {
      state.items = state.items.map((n) => ({ ...n, read: true }));
    },
    resetNotifications: (state) => {
      state.items = [];
      state.fetched = false;
      state.error = null;
      state.loading = false;
    },
    // Force a re-fetch on next dispatch (e.g. after mark-all-read)
    invalidateNotifications: (state) => {
      state.fetched = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.fetched = true;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.fetched = true; // mark as fetched to avoid infinite retry
      });
  },
});

export const {
  markAllReadLocally,
  resetNotifications,
  invalidateNotifications,
} = notificationsSlice.actions;

export const notificationsReducer = notificationsSlice.reducer;

export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationsLoading = (state) =>
  state.notifications.loading;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectNotificationsFetched = (state) =>
  state.notifications.fetched;
