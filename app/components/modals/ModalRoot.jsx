"use client";
import RatingModal from "./RatingModal";
import ReviewModal from "./ReviewModal";
import AddEventModal from "./AddEventModal";
import AddClubDateModal from "./AddClubDateModal";
import AddAlbumModal from "./AddAlbumModal";
import AcceptBookingModal from "./AcceptBookingModal";
import PrivacyAndTermsModal from "./PrivacyAndTermsModal";
import BookingForm from "../forms/BookingForm";
import ReportForm from "../forms/ReportForm";
import SuccessOnSubmit from "../materials/SuccessOnSubmit";
import ViewSubmittedInfo from "../materials/ViewSubmittedInfo";

const ModalRoot = () => (
  <>
    <RatingModal />
    <ReviewModal />
    <AddEventModal />
    <AddClubDateModal />
    <AddAlbumModal />
    <AcceptBookingModal />
    <BookingForm />
    <ReportForm />
    <PrivacyAndTermsModal />
    <SuccessOnSubmit />
    <ViewSubmittedInfo />
  </>
);

export default ModalRoot;
