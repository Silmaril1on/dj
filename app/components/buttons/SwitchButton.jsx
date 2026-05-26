"use client";

/**
 * SwitchButton — a toggle switch component.
 * Props:
 *   checked   {boolean}  — current on/off state
 *   onChange  {fn}       — called with next boolean value
 *   disabled  {boolean}  — disables interaction
 *   label     {string}   — optional label rendered beside the switch
 *   size      {"sm"|"md"} — defaults to "md"
 */
const SwitchButton = ({
  checked = false,
  onChange,
  disabled = false,
  label = "",
  size = "md",
}) => {
  const isSm = size === "sm";
  const track = isSm ? "h-4 w-8" : "h-5 w-10";
  const thumb = isSm ? "h-3 w-3" : "h-4 w-4";
  const thumbOn = isSm ? "translate-x-[18px]" : "translate-x-[22px]";
  const thumbOff = "translate-x-[2px]";

  return (
    <label
      className={`inline-flex items-center gap-2 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${track} ${
          checked ? "bg-gold" : "bg-stone-600"
        }`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow transition-transform duration-200 ${thumb} ${
            checked ? thumbOn : thumbOff
          }`}
        />
      </button>
      {label && (
        <span className="text-xs text-chino leading-none">{label}</span>
      )}
    </label>
  );
};

export default SwitchButton;
