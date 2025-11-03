"use client"
import React, { useState, useRef, useEffect } from "react";
import { IoIosArrowDown , IoIosArrowUp } from "react-icons/io";

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
        className="appearance-none relative  lg:px-3 p-1 lg:py-2 border border-gold/40 text-gold bg-gold/20 focus:outline-none focus:ring-2 focus:ring-orange duration-300 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs lg:text-base truncate">{getDisplayText()}</span>
          {isOpen ? (
            <IoIosArrowUp className="w-4 h-4 flex-shrink-0 ml-2 transition-all duration-200" />
          ) : (
            <IoIosArrowDown className="w-4 h-4 flex-shrink-0 ml-2 transition-all duration-200" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-stone-900 border border-orange/40 border-t-0 z-50 max-h-60 overflow-y-auto">
          <div
            className="px-1 lg:px-3 pt-1 lg:py-2 text-sm lg:text-base text-gold hover:bg-gold hover:text-stone-900 cursor-pointer transition-colors duration-300"
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
                className="px-1 lg:px-3 py-1 lg:py-2 text-sm lg:text-base text-gold hover:bg-gold hover:text-stone-900 cursor-pointer transition-colors duration-200 border-t border-orange/20"
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
            className="appearance-none rounded-none relative block w-full lg:w-44 p-1 lg:px-3 lg:py-2 text-sm lg:text-base border border-orange/40 placeholder-gold/40 text-gold bg-gold/20 focus:outline-none focus:ring-2 focus:ring-orange duration-300 col-span-2"
          />
        );
      })}
    </div>
  );
};

export default FilterBar;
