const Spinner = ({ className, size }) => {
    let sizeClass = 'w-5 h-5';
    if (size === 'sm') sizeClass = 'w-3 h-3';
    if (size === 'lg') sizeClass = 'w-7 h-7';
    return (
        <div className={`flex items-center rounded-full justify-center ${sizeClass} ${className}`}>
            <div className="animate-spin rounded-full w-full h-full border-t-3 border-gold"></div>
        </div>
    );
};

export default Spinner;
