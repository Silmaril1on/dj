"use client";
import { termsAndConditionsData } from "@/app/lib/localDB/termsAndConditionsData";
import Link from "next/link";
import { useState } from "react";
import { MdOutlineUpdate } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";

const FaqItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const separatorIndex = item.indexOf(" — ");
  const question = separatorIndex !== -1 ? item.slice(0, separatorIndex) : item;
  const answer = separatorIndex !== -1 ? item.slice(separatorIndex + 3) : "";
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 text-cream/80 hover:text-gold"
      >
        <span className=" text-sm font-bold leading-snug transition-colors duration-200">
          {question}
        </span>
        <FaChevronDown
          className={`text-gold/50 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-gold" : "hover:text-gold/80"
          }`}
        />
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms ease",
        }}
      >
        <div className="overflow-hidden">
          <p className="text-chino text-sm pb-4 leading-relaxed secondary">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const LegalPage = ({ type }) => {
  const data = termsAndConditionsData[type];
  const [activeSection, setActiveSection] = useState(null);

  if (!data) return null;

  const scrollTo = (index) => {
    const el = document.getElementById(`section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(index);
    }
  };

  return (
    <main className="min-h-screen bg-stone-950 text-cream">
      {/* Hero */}
      <div className="relative overflow-hidden bg-black border-b border-gold/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,_rgba(180,140,60,0.10)_0%,_transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-6 py-16 lg:py-20">
          <p className="text-gold text-xs secondary px-3 py-1 rounded-full border border-gold/30 bg-gold/20 w-fit uppercase tracking-[0.35em] mb-4">
            Soundfolio · Support
          </p>
          <h1 className="text-cream text-3xl lg:text-5xl font-bold uppercase tracking-tight leading-tight">
            {data.title}
          </h1>
          <div className="flex text-chino items-center gap-3">
            <MdOutlineUpdate />
            <p className="text-[10px] secondary">
              Last Updated: {data.lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16 space-y-12">
        {/* Table of Contents */}
        <div className="bg-stone-900 border border-gold/15 p-5 lg:p-6">
          <p className="text-gold/60 text-xs uppercase font-bold tracking-[0.3em] mb-4">
            Contents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {data.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`flex items-center gap-3 text-left group transition-colors duration-200 py-0.5 ${
                  activeSection === index
                    ? "text-gold"
                    : "text-chino hover:text-cream"
                }`}
              >
                <span className="font-mono text-xs text-gold/30 group-hover:text-gold/60 transition-colors shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-snug secondary">
                  {section.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {data.sections.map((section, index) => (
            <div
              key={index}
              id={`section-${index}`}
              className="scroll-mt-8 group"
            >
              <div className="flex items-baseline gap-4 mb-5 pb-3 border-b border-gold/15">
                <span className="font-mono text-sm text-gold/50 shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-cream text-xl lg:text-2xl font-bold uppercase tracking-tight">
                  {section.title}
                </h2>
              </div>
              {type === "faq" ? (
                <div>
                  {section.items.map((item, itemIndex) => (
                    <FaqItem key={itemIndex} item={item} />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3 pl-2">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex gap-3 text-chino text-sm lg:text-base leading-relaxed"
                    >
                      <span className="text-gold/40 mt-[5px] shrink-0 text-xs">
                        ▸
                      </span>
                      <span className="secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gold/20 space-y-2">
          <p className="text-cream font-semibold text-sm leading-relaxed">
            {data.footer.note}
          </p>
          <p className="text-chino text-sm secondary leading-none">
            {data.footer.contact}
          </p>
          <p className="text-chino/60 secondary text-xs italic">
            {data.footer.version}
          </p>
        </div>

        {/* Cross-links */}
        {(() => {
          const allLinks = [
            {
              href: "/support/terms-and-conditions",
              label: "Terms & Conditions",
              key: "general",
            },
            {
              href: "/support/privacy-policy",
              label: "Privacy Policy",
              key: "privacy",
            },
            {
              href: "/support/help-center",
              label: "Help Center",
              key: "helpCenter",
            },
            { href: "/support/faq", label: "FAQ", key: "faq" },
            { href: "/support/cookies", label: "Cookies", key: "cookies" },
            { href: "/support/about", label: "About", key: "about" },
          ].filter((l) => l.key !== type);
          return (
            <div className="flex gap-x-4 gap-y-2 flex-wrap items-center">
              <span className="text-stone-600 text-[10px] uppercase tracking-widest">
                See also:
              </span>
              {allLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-gold/50 hover:text-gold text-xs uppercase tracking-widest duration-200 border-b border-gold/15 hover:border-gold/50 pb-0.5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          );
        })()}
      </div>
    </main>
  );
};

export default LegalPage;
