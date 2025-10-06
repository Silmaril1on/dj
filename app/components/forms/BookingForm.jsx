"use client";
import { useDispatch, useSelector } from 'react-redux';
import { selectBookingModal, closeBookingModal, setBookingLoading } from '@/app/features/bookingSlice';
import { setError } from '@/app/features/modalSlice';
import SubmissionForm from './SubmissionForm';
import { formConfigs } from '@/app/helpers/formData/formConfigs';
import Close from '../buttons/Close';
import Title from '../ui/Title';
import Paragraph from '../ui/Paragraph';

const BookingForm = () => {
  const dispatch = useDispatch();
  const { artistData, loading } = useSelector(selectBookingModal);

  const handleSubmit = async (formData) => {
    dispatch(setBookingLoading(true));
    
    try {
      const bookingData = {
        event_name: formData.get("event_name"),
        venue_name: formData.get("venue_name"),
        event_date: formData.get("event_date"),
        country: formData.get("country"),
        city: formData.get("city"),
        address: formData.get("address"),
        location_url: formData.get("location_url"),
        time: formData.get("time"),
        lineup: formData.get("lineup"),
        receiver_id: artistData.user_id,
        artist_id: artistData.id,
      };

      const response = await fetch('/api/artists/book-dj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send booking request');
      }

      dispatch(setError({
        message: "Booking request sent successfully! The DJ will be notified.",
        type: "success"
      }));
      dispatch(closeBookingModal());
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setBookingLoading(false));
    }
  };
 
  const handleClose = () => {
    dispatch(closeBookingModal());
  };

  return (
    <div>
      <div className="flex flex-col">
        <Title text="Book DJ" />
        <Paragraph text={artistData?.name || 'this DJ'} />
        <Close className="absolute top-3 right-3" onClick={handleClose} />
      </div>
      <SubmissionForm
        showGoogle={false}
        formConfig={formConfigs.bookDj}
        onSubmit={handleSubmit}
        isLoading={loading}
        submitButtonText={loading ? "Sending Request..." : "Send Booking Request"}
      />
    </div>
  );
};

export default BookingForm;