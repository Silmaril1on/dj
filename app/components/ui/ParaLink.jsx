import Link from 'next/link'

const ParaLink = ({ text, href, linkText }) => {
  return (
    <p className="text-xs text-stone-200 secondary">
      {text}
      <Link href={href} className="font-bold  text-gold/70 hover:text-gold ml-1 duration-300">
        {linkText}
      </Link>
    </p>
  )
}

export default ParaLink