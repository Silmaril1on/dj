import Close from '@/app/components/buttons/Close'
import Title from '@/app/components/ui/Title'

const BookingHeader = ({ setIsClosing, onClose }) => {

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    return (
        <div className="flex items-center justify-between border-b border-gold/30">
            <Title text="Booking Requests" />
            <Close onClick={handleClose} />
        </div>
    )
}

export default BookingHeader