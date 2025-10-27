'use client'
import { useSelector, useDispatch } from 'react-redux'
import { selectPrivacyTermsModal, closePrivacyTermsModal } from '@/app/features/privacyTermsSlice'
import { termsAndConditionsData } from '@/app/localDB/termsAndConditionsData'
import { IoClose } from 'react-icons/io5'
import Title from '@/app/components/ui/Title'
import Paragraph from '@/app/components/ui/Paragraph'

const PrivacyAndTermsModal = () => {
  const dispatch = useDispatch()
  const { type } = useSelector(selectPrivacyTermsModal)
  
  if (!type) return null

  const data = termsAndConditionsData[type]

  return (
    <div className="relative max-h-[80vh] overflow-y-auto">
      {/* Close Button */}
      <button
        onClick={() => dispatch(closePrivacyTermsModal())}
        className="absolute top-0 right-0 text-gold hover:text-cream duration-300 z-10"
      >
        <IoClose size={32} />
      </button>

      {/* Header */}
      <div className="mb-6 pr-10">
        <Title text={data.title} className="text-gold text-2xl lg:text-3xl mb-2" />
        <Paragraph 
          text={`Last Updated: ${data.lastUpdated}`} 
          className="text-chino text-sm"
        />
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {data.sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-cream text-lg lg:text-xl font-bold">
              {section.title}
            </h3>
            <ul className="space-y-2 list-disc list-inside pl-2">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-chino text-sm lg:text-base leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gold/30 space-y-2">
        <Paragraph text={data.footer.note} className="text-cream font-semibold" />
        <Paragraph text={data.footer.contact} className="text-chino text-sm" />
        <Paragraph text={data.footer.version} className="text-chino text-xs italic" />
      </div>
    </div>
  )
}

export default PrivacyAndTermsModal