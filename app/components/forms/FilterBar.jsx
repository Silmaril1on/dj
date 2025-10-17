import React, { useState, useRef, useEffect } from "react";

const CustomSelect = ({ value, onChange, options, placeholder = "All" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    const option = options.find((opt) =>
      typeof opt === "object" ? opt.value === value : opt === value
    );
    return typeof option === "object" ? option.label : option;
  };

  return (
    <div ref={selectRef} className="relative w-full lg:w-44">
      <div
        className="appearance-none relative px-3 py-2 border border-gold/40 text-gold bg-gold/20 focus:outline-none focus:ring-2 focus:ring-orange duration-300 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm lg:text-base truncate">{getDisplayText()}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? "rotate-180" : ""
            }`}
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
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-stone-900 border border-orange/40 border-t-0 z-50 max-h-60 overflow-y-auto">
          <div
            className="px-3 py-2 text-sm lg:text-base text-gold hover:bg-gold hover:text-stone-900 cursor-pointer transition-colors duration-300"
            onClick={() => handleOptionClick("")}
          >
            {placeholder}
          </div>
          {options.map((opt, index) => {
            const optionValue = typeof opt === "object" ? opt.value : opt;
            const optionLabel = typeof opt === "object" ? opt.label : opt;

            return (
              <div
                key={`${optionValue}-${index}`}
                className="px-3 py-2 text-sm lg:text-base text-gold hover:bg-gold hover:text-stone-900 cursor-pointer transition-colors duration-200 border-t border-orange/20"
                onClick={() => handleOptionClick(optionValue)}
              >
                {optionLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FilterBar = ({ config = [], values = {}, onChange }) => {
  const getPlaceholder = (field) => {
    // Use field label as placeholder, or fallback to field name
    return field.label || field.name.toUpperCase();
  };

  return (
    <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-4">
      {config.map((field) => {
        if (field.type === "select") {
          return (
            <CustomSelect
              key={field.name}
              value={values[field.name] || ""}
              onChange={(value) => onChange(field.name, value)}
              options={field.options}
              placeholder={getPlaceholder(field)}
            />
          );
        }

        if (field.type === "date") {
          return (
            <input
              key={field.name}
              type="date"
              value={values[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="appearance-none rounded-none relative block w-full lg:w-44 px-3 py-2 text-sm lg:text-base border border-orange/40 placeholder-gold/40 text-gold bg-gold/20 focus:outline-none focus:ring-2 focus:ring-orange duration-300"
            />
          );
        }

        // Default to text input
        return (
          <input
            key={field.name}
            type="text"
            placeholder={field.placeholder || getPlaceholder(field)}
            value={values[field.name] || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="appearance-none rounded-none relative block w-full lg:w-44 px-3 py-2 text-sm lg:text-base border border-orange/40 placeholder-gold/40 text-gold bg-gold/20 focus:outline-none focus:ring-2 focus:ring-orange duration-300 col-span-2"
          />
        );
      })}
    </div>
  );
};

export default FilterBar;
