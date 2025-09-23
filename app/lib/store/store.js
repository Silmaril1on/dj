import { configureStore } from "@reduxjs/toolkit";
import { modalReducer } from "@/app/features/modalSlice";
import { userReducer } from "@/app/features/userSlice";
import { reviewsReducer } from "@/app/features/reviewsSlice";
import { ratingReducer } from "@/app/features/ratingSlice";
import successReducer from "@/app/features/successSlice";
import evaluationReducer from "@/app/features/evaluationSlice";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    user: userReducer,
    reviews: reviewsReducer,
    rating: ratingReducer,
    success: successReducer,
    evaluation: evaluationReducer,
  },
});
