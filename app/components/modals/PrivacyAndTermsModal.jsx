"use client";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPrivacyTermsModal,
  closePrivacyTermsModal,
} from "@/app/features/privacyTermsSlice";
import { termsAndConditionsData } from "@/app/lib/localDB/termsAndConditionsData";
import Paragraph from "@/app/components/ui/Paragraph";
import GlobalModal from "./GlobalModal";

const PrivacyAndTermsModal = () => {
  const dispatch = useDispatch();
  const { isOpen, type } = useSelector(selectPrivacyTermsModal);

  if (!type) return null;

  const data = termsAndConditionsData[type];

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={() => dispatch(closePrivacyTermsModal())}
      title={data.title}
      maxWidth="max-w-4xl"
    >
      <Paragraph
        text={`Last Updated: ${data.lastUpdated}`}
        className="text-chino text-sm -mt-3 mb-4"
      />

      <div className="space-y-6">
        {data.sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-cream text-lg lg:text-xl font-bold">
              {section.title}
            </h3>
            <ul className="space-y-2 list-disc list-inside pl-2">
              {section.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="text-chino text-sm lg:text-base leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gold/30 space-y-2">
        <Paragraph
          text={data.footer.note}
          className="text-cream font-semibold"
        />
        <Paragraph text={data.footer.contact} className="text-chino text-sm" />
        <Paragraph
          text={data.footer.version}
          className="text-chino text-xs italic"
        />
      </div>
    </GlobalModal>
  );
};

export default PrivacyAndTermsModal;
