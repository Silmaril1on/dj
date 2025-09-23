import { termsAndConditionsData, artistTermsAndConditionsData, clubsTermsAndConditionsData } from '@/app/localDB/termsAndConditionsData'
import Title from '../ui/Title'
import Paragraph from '../ui/Paragraph'

const TermsAndConditions = ({ type = 'artist', className = '' }) => {
  const data = termsAndConditionsData[type] || termsAndConditionsData.artist

  return (
    <div className={`bg-black  p-4 max-w-md h-fit sticky top-4 ${className}`}>
      {/* Header */}
      <div className="mb-6 border-b border-gold/40 pb-4">
        <Title text={data.title} size="lg" />
        <Paragraph text={`Last updated: ${data.lastUpdated}`} />
      </div>

      {/* Terms Sections */}
      <div className="space-y-6 mb-6">
        {data.sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-gold font-semibold text-base mb-3">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2 text-sm text-cream">
                  <span className="text-gold font-bold mt-1">•</span>
                  <span className="leading-relaxed secondary text-xs">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gold/40 pt-4">
        <Paragraph text={data.footer.note} />
        <Title text={data.footer.contact} size="xs" />
        <Paragraph text={data.footer.version} />
      </div>
    </div>
  )
}

export default TermsAndConditions