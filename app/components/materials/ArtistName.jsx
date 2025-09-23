const ArtistName = ({ artistName, size = 'lg', className = '' }) => {
  const displayName = artistName?.stage_name || artistName?.name


  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-md',
    lg: 'text-2xl',
    xl: 'text-3xl',
    xxl: 'text-6xl',
  }

  return (
    <h1 className={`${sizeClasses[size]} font-bold text-gold capitalize ${className}`}>
      {displayName}
    </h1>
  )
}

export default ArtistName