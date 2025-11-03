import FlexBox from './FlexBox'
import Motion from './Motion'

const SectionContainer = ({
  title,
  description,
  className = "",
  children,
  size = "md",
}) => {
  const getTitleSize = (size) => {
    switch (size) {
      case "sm":
        return "text-sm lg:text-lg";
      case "md":
      default:
        return "text-xl lg:text-3xl";
    }
  };

  const getDescriptionSize = (size) => {
    switch (size) {
      case "sm":
        return "text-[11px]";
      case "md":
      default:
        return "text-[10px] lg:text-xs";
    }
  };

  return (
    <div className={`w-full flex flex-col space-y-2 pt-3 ${className}`}>
      <FlexBox type="column-start">
        <Motion animation="left" stagger className="w-full overflow-hidden pl-2 lg:pl-4 flex flex-col items-start">
          <h1 className={`font-bold ${getTitleSize(size)} leading-none text-gold`}>{title}</h1>
          <p className={`${getDescriptionSize(size)} text-cream secondary leading-none`}>{description}</p>
        </Motion>
      </FlexBox>
      <div className='w-full border-t border-gold p-2 lg:p-4 grow-1 flex justify-center items-center'>
        {children}
      </div>
    </div>
  )
}

export default SectionContainer