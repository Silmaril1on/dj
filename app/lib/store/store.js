import { configureStore } from "@reduxjs/toolkit";
import { modalReducer } from "@/app/features/modalSlice";
import { userReducer } from "@/app/features/userSlice";
import { reviewsReducer } from "@/app/features/reviewsSlice";
import { ratingReducer } from "@/app/features/ratingSlice";
import successReducer from "@/app/features/successSlice";
import evaluationReducer from "@/app/features/evaluationSlice";
import editProductReducer from "@/app/features/editProductSlice";
import reportsReducer from "@/app/features/reportsSlice";
import bookingReducer from "@/app/features/bookingSlice";
import acceptBookingReducer from "@/app/features/bookingSlice";
import welcomeReducer from "@/app/features/welcomeSlice";
import { privacyTermsReducer } from "@/app/features/privacyTermsSlice";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    user: userReducer,
    reviews: reviewsReducer,
    rating: ratingReducer,
    success: successReducer,
    evaluation: evaluationReducer,
    editProduct: editProductReducer,
    reports: reportsReducer,
    booking: bookingReducer,
    acceptBooking: acceptBookingReducer,
    welcome: welcomeReducer,
    privacyTerms: privacyTermsReducer,
  },
});
