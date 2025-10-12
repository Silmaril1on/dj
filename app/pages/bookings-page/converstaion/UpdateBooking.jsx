import Button from '@/app/components/buttons/Button'
import SpanText from '@/app/components/ui/SpanText';
import Title from '@/app/components/ui/Title';
import FlexBox from '@/app/components/containers/FlexBox';
import { FaCheck, FaHandshake } from 'react-icons/fa';
import React, { useState } from 'react'

const UpdateBooking = ({ bookingId, bookingData, user, onBookingUpdate }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);

  // Check confirmation status
  const confirmedBy = bookingData?.confirmed_by || [];
  const isConfirmedByCurrentUser = confirmedBy.includes(user?.id);
  const isFullyConfirmed = bookingData?.response === "confirmed";
  const isWaitingForOtherUser = confirmedBy.length === 1 && isConfirmedByCurrentUser;
  const isWaitingForCurrentUser = confirmedBy.length === 1 && !isConfirmedByCurrentUser;

  const handleConfirmBooking = async () => {
    if (!bookingId || !user?.id) return;

    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch('/api/booking-requests/booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Booking confirmation:', data.message);
        // Call parent callback to update booking data
        if (onBookingUpdate) {
          onBookingUpdate(data.data);
        }
      } else {
        console.error('❌ Confirmation failed:', data.error);
        setError(data.error || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('❌ Error confirming booking:', error);
      setError('Failed to confirm booking');
    } finally {
      setIsConfirming(false);
    }
  };

  // If booking is fully confirmed, show success message
  if (isFullyConfirmed) {
    return (
      <div className="bg-green-900/30 border border-green-600/50 p-4 rounded-sm">
        <FlexBox className="items-center gap-3 mb-3">
          <FaHandshake className="text-green-400 text-xl" />
          <Title text="Deal Confirmed! 🎉" size="md" className="text-green-400" />
        </FlexBox>
        <SpanText
          text="Congratulations! Both parties have confirmed the booking agreement. The deal is now official and binding."
          color="green-300"
          size="sm"
          className="mb-2"
        />
        <SpanText
          text={`Confirmed on: ${new Date(bookingData.confirmed_at).toLocaleDateString()}`}
          color="green-200"
          size="xs"
        />
      </div>
    );
  }

  // Determine button text and state
  let buttonText = "Confirm Deal";
  let buttonDisabled = false;

  if (isWaitingForOtherUser) {
    buttonText = "Confirmation Pending";
    buttonDisabled = true;
  } else if (isWaitingForCurrentUser) {
    buttonText = "Awaiting Confirmation";
    buttonDisabled = false;
  } else if (isConfirming) {
    buttonText = "Confirming...";
    buttonDisabled = true;
  }

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button 
        text={buttonText}
        type={isWaitingForOtherUser ? "disabled" : "success"}
        onClick={handleConfirmBooking}
        disabled={buttonDisabled || isConfirming}
        loading={isConfirming}
        icon={isWaitingForOtherUser ? <FaCheck /> : null}
      />
      
      {/* Status messages */}
      {isWaitingForOtherUser ? (
        <div>
          <SpanText
            text="✅ You have confirmed the deal. Waiting for the other party to confirm."
            color="yellow-300"
            size="xs"
          />
          <SpanText
            text="Once both parties confirm, the booking will be finalized."
            color="cream"
            size="xs"
          />
        </div>
      ) : isWaitingForCurrentUser ? (
        <div >
          <SpanText
            text="⏳ The other party has confirmed. Click to complete the deal!"
            color="green-300"
            size="xs"
          />
          <SpanText
            text="By clicking Confirm Deal, both parties acknowledge mutual agreement to the booking terms."
            color="cream"
            size="xs"
          />
        </div>
      ) : (
        <div>
          <SpanText
            text="Made a deal? Update the booking status to keep things on track."
            color="cream"
            size="xs"
          />
          <SpanText
            text="By clicking Confirm Deal, both parties acknowledge mutual agreement to the booking terms discussed in this chat."
            color="cream"
            size="xs"
          />
        </div>
      )}

      {/* Error display */}
      {error && (
        <SpanText
          text={error}
          color="red-400"
          size="xs"
          className="bg-red-900/20 p-2 rounded border border-red-500"
        />
      )}
    </div>
  );
}

export default UpdateBooking;