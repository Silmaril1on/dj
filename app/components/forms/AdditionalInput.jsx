"use client";
import { FaPlus, FaMinus } from "react-icons/fa6";

const AdditionalInput = ({
  fields,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  minFields = 1,
  maxFields = 10,
  id = "",
  name = "", 
}) => {
  const canAdd = fields.length < maxFields;
  const canRemove = fields.length > minFields;

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const inputId = `${id || name}-${index}`;
        const inputName = `${name || id}[${index}]`;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              {placeholder} {index + 1}
            </label>
            <input
              id={inputId}
              name={inputName}
              type="text"
              value={field || ""}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder={placeholder}
            />

            {canRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-crimson bg-crimson/20 border border-red/40 cursor-pointer"
                title="Remove field"
                aria-label={`Remove ${placeholder} ${index + 1}`}
              >
                <FaMinus size={13} />
              </button>
            )}

            {canAdd && index === fields.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="p-1 text-gold bg-gold/20 border border-gold/40 cursor-pointer"
                title="Add field"
                aria-label={`Add ${placeholder}`}
              >
                <FaPlus size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdditionalInput;
