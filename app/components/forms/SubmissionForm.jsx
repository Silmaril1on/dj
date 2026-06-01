"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  MdUpload,
  MdEdit,
  MdPerson,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdCheck,
} from "react-icons/md";
import Button from "@/app/components/buttons/Button";
import Title from "@/app/components/ui/Title";
import Icon from "@/app/components/ui/Icon";
import SelectInput from "./SelectInput";
import AdditionalInput from "./AdditionalInput";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import SwitchButton from "@/app/components/buttons/SwitchButton";
import { checkPasswordStrength } from "@/app/helpers/validatePwd";
import GoogleAuth from "../buttons/GoogleAuth";
import FlexBox from "../containers/FlexBox";
import { setError } from "@/app/features/modalSlice";

const SubmissionForm = ({
  showGoogle = true,
  formConfig,
  onSubmit,
  onDataChange = null,
  isLoading = false,
  success = false,
  onSuccessAction = null,
  successMessage = "Form submitted successfully!",
  submitButtonText = "Submit",
  className = "",
  showPasswordStrength = false,
  hideActions = false,
  renderAs = "form",
  idPrefix = "",
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(formConfig.initialData || {});
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [extraImageFiles, setExtraImageFiles] = useState({});
  const [extraImagePreviews, setExtraImagePreviews] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);
  const currentUploadFieldRef = useRef(null);
  const initialDataKey = useMemo(
    () => JSON.stringify(formConfig.initialData || {}),
    [formConfig.initialData],
  );

  const getAdditionalFieldValues = (value) => {
    if (Array.isArray(value) && value.length > 0) return value;
    return [""];
  };

  // Initialize form data when config changes
  useEffect(() => {
    setFormData(formConfig.initialData || {});
    if (
      formConfig.imageField &&
      formConfig.initialData[formConfig.imageField]
    ) {
      setExistingImage(formConfig.initialData[formConfig.imageField]);
    }
    if (formConfig.initialData?.user_avatar) {
      setExistingImage(formConfig.initialData.user_avatar);
    }
  }, [initialDataKey, formConfig.imageField]);

  const handleInputChange = (field, value) => {
    const nextData = {
      ...formData,
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (onDataChange) {
      onDataChange(nextData);
    }

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    // Validate field if it has validation
    const fieldConfig = formConfig.fields[field];
    if (fieldConfig?.validation) {
      const error = fieldConfig.validation(value, formData);
      if (error) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
      }
    }

    // Update password strength for password field (only if enabled)
    if (field === "password" && showPasswordStrength) {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Call custom onChange if provided
    if (fieldConfig?.onChange) {
      const result = fieldConfig.onChange(value);
      if (field === "password" && result) {
        setPasswordStrength(result);
      }
    }
  };

  const handleArrayFieldChange = (field, index, value) => {
    const currentValues = getAdditionalFieldValues(formData[field]);
    const nextValues = currentValues.map((item, i) =>
      i === index ? value : item,
    );
    const nextData = { ...formData, [field]: nextValues };
    setFormData(nextData);
    if (onDataChange) onDataChange(nextData);
  };

  const addArrayField = (field) => {
    const currentValues = getAdditionalFieldValues(formData[field]);
    const nextData = { ...formData, [field]: [...currentValues, ""] };
    setFormData(nextData);
    if (onDataChange) onDataChange(nextData);
  };

  const removeArrayField = (field, index) => {
    const currentValues = getAdditionalFieldValues(formData[field]);
    if (currentValues.length <= 1) return;
    const nextData = {
      ...formData,
      [field]: currentValues.filter((_, i) => i !== index),
    };
    setFormData(nextData);
    if (onDataChange) onDataChange(nextData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        dispatch(
          setError({
            message: "Please upload a valid image file",
            type: "error",
          }),
        );
        currentUploadFieldRef.current = null;
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        dispatch(
          setError({
            message: "Image size must be less than 15MB",
            type: "error",
          }),
        );
        currentUploadFieldRef.current = null;
        return;
      }

      const uploadField =
        currentUploadFieldRef.current || formConfig.imageField;
      currentUploadFieldRef.current = null;
      // Reset the input so the same file can be re-selected for a different field
      e.target.value = "";

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (uploadField === formConfig.imageField) {
          setImagePreview(ev.target.result);
        } else {
          setExtraImagePreviews((prev) => ({
            ...prev,
            [uploadField]: ev.target.result,
          }));
        }
      };
      reader.readAsDataURL(file);

      if (uploadField === formConfig.imageField) {
        setSelectedFile(file);
        setFormData((prev) => ({
          ...prev,
          [formConfig.imageField]: file,
        }));
      } else {
        setExtraImageFiles((prev) => ({ ...prev, [uploadField]: file }));
        setFormData((prev) => ({ ...prev, [uploadField]: file }));
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {};

    Object.keys(formConfig.fields).forEach((fieldName) => {
      const fieldConfig = formConfig.fields[fieldName];
      const value = formData[fieldName];

      // Check required fields
      if (
        fieldConfig.required &&
        (!value || (typeof value === "string" && !value.trim()))
      ) {
        isValid = false;
        errors[fieldName] = `${fieldConfig.label || fieldName} is required`;
      }

      // Run field validation if present
      if (fieldConfig.validation && value) {
        const error = fieldConfig.validation(value, formData);
        if (error) {
          isValid = false;
          errors[fieldName] = error;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const normalizeArrayField = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return value.split("\n").map((item) => item.trim());
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // Filter out empty strings from arrays
    const filteredData = { ...formData };
    formConfig.arrayFields?.forEach((field) => {
      const normalized = normalizeArrayField(filteredData[field]);
      filteredData[field] = normalized.filter(
        (item) => item && typeof item === "string" && item.trim() !== "",
      );
    });
    // Create FormData for file upload
    const formDataToSend = new FormData();
    // Add non-array, non-image fields first
    Object.keys(filteredData).forEach((key) => {
      if (
        key !== formConfig.imageField &&
        !formConfig.arrayFields?.includes(key) &&
        filteredData[key] !== null &&
        filteredData[key] !== undefined
      ) {
        formDataToSend.append(key, filteredData[key]);
      }
    });
    // Add image file
    if (selectedFile) {
      formDataToSend.append(formConfig.imageField, selectedFile);
    }
    // Add extra image files (for forms with multiple image upload fields)
    Object.entries(extraImageFiles).forEach(([field, file]) => {
      if (file) formDataToSend.append(field, file);
    });
    // Add arrays as JSON strings (always send, even if empty)
    formConfig.arrayFields?.forEach((field) => {
      const arrayData = filteredData[field] || [];
      formDataToSend.append(field, JSON.stringify(arrayData));
    });
    await onSubmit(formDataToSend);
  };

  const renderField = (fieldName, fieldConfig) => {
    const {
      type,
      required,
      placeholder,
      options,
      rows,
      icon,
      validation,
      onChange,
      helpText,
      label,
      hideLabel: _hideLabel,
      ...otherProps
    } = fieldConfig;
    const fieldValue = formData[fieldName] || "";
    const inputId = idPrefix ? `${idPrefix}-${fieldName}` : fieldName;

    // Get icon component
    const getIcon = () => {
      switch (icon) {
        case "email":
          return <MdEmail className="absolute left-3 top-1.5 h-5 w-5" />;
        case "lock":
          return <MdLock className="absolute left-3 top-1.5 h-5 w-5" />;
        case "person":
          return <MdPerson className="absolute left-3 top-2.5 h-5 w-5" />;
        default:
          return null;
      }
    };

    // Render input with icon wrapper
    const renderInputWithIcon = (inputElement) => {
      if (!icon) return inputElement;

      return (
        <div className="relative ">
          {inputElement}
          {getIcon()}
          {type === "password" && (
            <Icon
              onClick={() =>
                setShowPassword((prev) => ({
                  ...prev,
                  [fieldName]: !prev[fieldName],
                }))
              }
              icon={
                showPassword[fieldName] ? <MdVisibilityOff /> : <MdVisibility />
              }
              color="simple"
              className="absolute right-1 top-0 h-full"
            />
          )}
        </div>
      );
    };

    switch (type) {
      case "select":
        return (
          <SelectInput
            id={inputId}
            name={fieldName}
            value={fieldValue}
            onChange={(value) => handleInputChange(fieldName, value)}
            options={options || []}
            placeholder={placeholder}
            searchable={fieldConfig.searchable}
            showFlags={fieldConfig.showFlags}
            className=""
          />
        );

      case "image":
        const isAvatar =
          fieldName.includes("avatar") || fieldName.includes("profile");
        const containerClass = isAvatar ? "w-24 h-24" : "w-32 h-32";
        const iconSize = isAvatar ? "text-4xl" : "w-8 h-8";
        const editButtonClass =
          "absolute bottom-1 right-1 bg-gold hover:bg-gold/80 text-black p-2 shadow-xl transition-colors";
        const isMainImageField = fieldName === formConfig.imageField;
        // Determine the active preview for this specific field
        const previewForField = isMainImageField
          ? imagePreview
          : extraImagePreviews[fieldName] || null;
        const existingImageForField = isMainImageField
          ? existingImage
          : fieldValue || null;
        const triggerUpload = () => {
          currentUploadFieldRef.current = fieldName;
          fileInputRef.current?.click();
        };
        return (
          <div id={fieldName} className="flex items-start space-x-3 ">
            <div className="relative">
              <div
                className={`${containerClass} overflow-hidden bg-stone-700 border-2 border-gold/30`}
              >
                {previewForField ? (
                  <img
                    loading="lazy"
                    src={previewForField}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : existingImageForField ? (
                  <img
                    loading="lazy"
                    src={existingImageForField}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isAvatar ? (
                      <MdPerson className={`${iconSize} text-gray-400`} />
                    ) : (
                      <MdUpload className={`${iconSize} text-gray-400`} />
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={triggerUpload}
                className={editButtonClass}
                title="Upload Image"
              >
                <MdEdit size={16} />
              </button>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={triggerUpload}
                className="px-2 py-1 bg-gold/30 text-gold border border-gold/30  transition-colors flex items-center gap-2"
              >
                <MdUpload size={20} />
                {previewForField ? "Change Image" : "Upload Image"}
              </button>
              <p className="text-[10px] text-chino/70 mt-2 secondary">
                {fieldConfig.helpText || "Upload an image (max 15MB)."}
              </p>
            </div>
          </div>
        );

      case "switch": {
        const isOn = Boolean(formData[fieldName]);
        return (
          <SwitchButton
            checked={isOn}
            onChange={(val) => handleInputChange(fieldName, val)}
            label={fieldConfig.switchLabel || ""}
          />
        );
      }

      case "textarea":
        return (
          <textarea
            id={inputId}
            name={fieldName}
            required={required}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className="h-28lg:h-40"
            {...otherProps}
          />
        );

      case "additional":
        return (
          <AdditionalInput
            id={inputId}
            name={fieldName}
            fields={getAdditionalFieldValues(formData[fieldName])}
            onChange={(index, value) =>
              handleArrayFieldChange(fieldName, index, value)
            }
            onAdd={() => addArrayField(fieldName)}
            onRemove={(index) => removeArrayField(fieldName, index)}
            placeholder={placeholder}
            minFields={fieldConfig.minFields || 1}
            maxFields={fieldConfig.maxFields || Infinity}
          />
        );

      case "checkbox":
        const isChecked = Boolean(formData[fieldName]);
        return (
          <div className="pt-2">
            <input
              id={inputId}
              name={fieldName}
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              className="sr-only"
              {...otherProps}
            />
            <label
              htmlFor={inputId}
              className="inline-flex items-center gap-2 cursor-pointer select-none"
            >
              <span
                className={`relative flex h-5 w-5 items-center justify-center border transition-colors ${
                  isChecked
                    ? "border-gold bg-gold/25"
                    : "border-cream/45 bg-black/40"
                }`}
              >
                <MdCheck
                  className={`h-4 w-4 text-gold transition-opacity ${
                    isChecked ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
              <span className="text-xs text-cream/90">
                {label || "Sold out"}
              </span>
            </label>
          </div>
        );

      default:
        const hideNumberArrows =
          type === "number"
            ? "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            : "";
        const inputElement = (
          <input
            id={inputId}
            name={fieldName}
            type={
              type === "password"
                ? showPassword[fieldName]
                  ? "text"
                  : "password"
                : type
            }
            required={required}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className={`${icon ? "pl-10 " : ""}${hideNumberArrows}`}
            autoComplete={fieldConfig.autoComplete || "off"}
            {...otherProps}
          />
        );
        return renderInputWithIcon(inputElement);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gold mb-4">Success!</h1>
        <p className="text-chino mb-6">{successMessage}</p>
        {onSuccessAction && (
          <Button text="Continue" onClick={onSuccessAction} />
        )}
      </div>
    );
  }

  const isDivWrapper = renderAs === "div";
  const WrapperTag = isDivWrapper ? "div" : "form";
  const wrapperProps = isDivWrapper
    ? { className: `space-y-2 w-full ${className}` }
    : {
        onSubmit: handleSubmit,
        noValidate: true,
        className: `space-y-2 w-full ${className}`,
      };

  return (
    <WrapperTag {...wrapperProps}>
      {formConfig.sections?.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {section.title && (
            <Title
              color="cream"
              className="leading-none mt-5"
              text={section.title}
            />
          )}
          <div className={section.gridClass || "grid grid-cols-1 gap-4"}>
            {section.fields?.map((fieldName) => {
              const fieldConfig = formConfig.fields[fieldName];
              if (!fieldConfig) return null;

              return (
                <div key={fieldName}>
                  {/* Render label for all types except image, additional, checkbox, and switch */}
                  {fieldConfig.type !== "image" &&
                    fieldConfig.type !== "additional" &&
                    fieldConfig.type !== "checkbox" &&
                    fieldConfig.type !== "switch" &&
                    !fieldConfig.hideLabel && (
                      <label
                        htmlFor={
                          idPrefix ? `${idPrefix}-${fieldName}` : fieldName
                        }
                      >
                        {fieldConfig.label ||
                          fieldName
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        {fieldConfig.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                    )}

                  {/* For additional type, render label without htmlFor */}
                  {fieldConfig.type === "additional" && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-cream">
                        {fieldConfig.label ||
                          fieldName
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        {fieldConfig.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </div>
                  )}

                  {renderField(fieldName, fieldConfig)}

                  {/* Display field error if exists */}
                  {fieldErrors[fieldName] && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors[fieldName]}
                    </p>
                  )}

                  {/* Display help text if exists and no error */}
                  {!fieldErrors[fieldName] && fieldConfig.helpText && (
                    <p className="text-chino/60 text-xs mt-1">
                      {fieldConfig.helpText}
                    </p>
                  )}

                  {fieldName === "password" &&
                    formData[fieldName] &&
                    showPasswordStrength && (
                      <PasswordStrengthIndicator
                        strength={passwordStrength}
                        password={formData[fieldName]}
                      />
                    )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {formConfig.imageField && (
        <input
          id={`${formConfig.imageField}_file`}
          name={`${formConfig.imageField}_file`}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      )}
      {!hideActions && !isDivWrapper && (
        <FlexBox type="row-between" className="mt-4">
          <Button
            type="submit"
            text={isLoading ? "Submitting..." : submitButtonText}
            loading={isLoading}
            disabled={isLoading}
          />
          {showGoogle && <GoogleAuth />}
        </FlexBox>
      )}
    </WrapperTag>
  );
};

export default SubmissionForm;
