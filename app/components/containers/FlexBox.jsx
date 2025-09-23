const FlexBox = ({
    children,
    className = "",
    type = "center",
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
}) => {
    const getLayout = (type) => {
        switch (type) {
            case "row-center":
                return "flex justify-center";
            case "row-start":
                return "flex justify-start";
            case "row-between":
                return "flex justify-between";
            case "row-evenly":
                return "flex justify-evenly";
            case "row-around":
                return "flex justify-around";
            case "row-center-end":
                return "flex justify-center items-end";
            case "row-around-end":
                return "flex justify-around items-end";
            case "row-between-end":
                return "flex justify-between items-end";
            case "row-evenly-end":
                return "flex justify-evenly items-end";
            case "column":
                return "flex flex-col";
            case "column-center":
                return "flex flex-col justify-center";
            case "column-between":
                return "flex flex-col justify-between";
            case "column-evenly":
                return "flex flex-col justify-evenly";
            case "column-around":
                return "flex flex-col justify-around";
            case "column-center-end":
                return "flex flex-col justify-center items-end";
            case "column-around-end":
                return "flex flex-col justify-around items-end";
            case "column-between-end":
                return "flex flex-col justify-between items-end";
            case "column-evenly-end":
                return "flex flex-col justify-evenly items-end";
            case "column-start":
                return "flex flex-col items-start";
            case "column-end":
                return "flex flex-col items-end";
            case "center-col":
                return "flex flex-col items-center justify-center";
            default:
                return "flex items-center justify-center";
        }
    };

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className={`${getLayout(type)} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default FlexBox;