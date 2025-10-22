"use client";
import { useState } from "react";
import { CountryFlags } from "@/app/components/materials/CountryFlags";

const SelectInput = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  searchable = false,
  showFlags = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle different option formats
  const getOptionValue = (option) => {
    return typeof option === "string" ? option : option.value;
  };

  const getOptionLabel = (option) => {
    return typeof option === "string" ? option : option.label;
  };

  const filteredOptions = searchable
    ? options.filter((option) =>
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectedOption = options.find(
    (option) => getOptionValue(option) === value
  );

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        name={name}
        className="appearance-none rounded-none relative w-full px-2 py-1 lg:px-3 lg:py-2 border border-orange/40 placeholder-gold/40 text-gold bg-gold/20 focus:outline-none focus:ring-2 focus:ring-orange duration-300 flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {showFlags && value && (
            <CountryFlags countryName={value} className="w-5 h-5" />
          )}
          <span className={value ? "text-chino" : "text-chino/50"}>
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-chino transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-black border border-gold/30 rounded-md shadow-lg max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gold/20">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto" role="listbox">
            {filteredOptions.map((option, index) => (
              <div
                key={getOptionValue(option) || index}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gold/10 cursor-pointer"
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={getOptionValue(option) === value}
              >
                {showFlags && (
                  <CountryFlags
                    countryName={getOptionValue(option)}
                    className="w-4 h-4"
                  />
                )}
                <span className="text-sm text-chino">
                  {getOptionLabel(option)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectInput;
