'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import FormContainer from '@/app/components/forms/FormContainer'
import TermsAndConditions from '@/app/components/materials/TermsAndConditions'

const AddEvent = () => {
    const dispatch = useDispatch()
    const searchParams = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [eventData, setEventData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [prefill, setPrefill] = useState({})

    useEffect(() => {
        const edit = searchParams.get('edit');
        const eventId = searchParams.get('eventId');
        if (edit === 'true' && eventId) {
            setIsEditMode(true);
            fetchEventData(eventId);
        }
    }, [searchParams]);

    useEffect(() => {
        // Read club data from query params
        const club_id = searchParams.get('club_id');
        const venue_name = searchParams.get('venue_name');
        const address = searchParams.get('address');
        const location_url = searchParams.get('location_url');
        const country = searchParams.get('country');
        const city = searchParams.get('city');
        setPrefill({
            club_id,
            venue_name,
            address,
            location_url,
            country,
            city,
        });
    }, [searchParams]);

    // Create form config with initial data for edit mode
    const formConfig = {
        ...formConfigs.addEvent,
        initialData: isEditMode && eventData
            ? Object.fromEntries(
                Object.entries(formConfigs.addEvent.initialData).map(([key, defaultValue]) => [
                    key,
                    eventData[key] !== undefined && eventData[key] !== null
                        ? eventData[key]
                        : defaultValue
                ])
            )
            : { ...formConfigs.addEvent.initialData, ...prefill }
    };

    const fetchEventData = async (eventId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${eventId}`);
            if (response.ok) {
                const data = await response.json();
                setEventData(data);
            } else {
                dispatch(setError({ message: 'Failed to fetch event data', type: 'error' }));
            }
        } catch (error) {
            dispatch(setError({ message: 'Error fetching event data', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (formData) => {
        setIsSubmitting(true)
        dispatch(setError(''))

        try {
            let url = '/api/events';
            let method = 'POST';

            if (isEditMode && eventData) {
                url = '/api/events';
                method = 'PATCH';
                formData.append('eventId', eventData.id);
            }

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || (isEditMode ? 'Failed to update event' : 'Failed to create event'));
            }

            const result = await response.json();
            dispatch(showSuccess({
                type: 'event',
                image: result.data?.event_image || '',
                name: result.data?.event_name || '',
                country: result.data?.country || '',
                city: result.data?.city || '',
                address: result.data?.address || '',
                description: result.data?.description || '',
                date: result.data?.date || '',
                promoter: result.data?.promoter || ''
            }));
        } catch (err) {
            dispatch(setError({ message: err.message, type: 'error' }));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full">
          <FormContainer
            maxWidth="w-full"
            title="Add Event"
            description="Create a new event and share it with the community"
          >
            <SubmissionForm
              formConfig={formConfig}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitButtonText={isEditMode ? "Update Event" : "Create Event"}
            />
          </FormContainer>
        </div>
        <div className="w-full lg:w-[35%] lg:min-w-[400px]">
          <TermsAndConditions type="event" />
        </div>
      </div>
    );
}

export default AddEvent