'use client'
import { useState, useRef, useEffect } from 'react'
import { MdUpload, MdEdit, MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import Button from '@/app/components/buttons/Button'
import Title from '@/app/components/ui/Title'
import Icon from '@/app/components/ui/Icon'
import SelectInput from './SelectInput'
import AdditionalInput from './AdditionalInput'
import PasswordStrengthIndicator from './PasswordStrengthIndicator'
import { checkPasswordStrength } from '@/app/helpers/validatePwd'
import GoogleAuth from '../buttons/GoogleAuth'
import FlexBox from '../containers/FlexBox'

const SubmissionForm = ({
  showGoogle = true,
  formConfig,
  onSubmit,
  isLoading = false,
  success = false,
  onSuccessAction = null,
  successMessage = "Form submitted successfully!",
  submitButtonText = "Submit",
  className = "",
  showPasswordStrength = false,
}) => {
  const [formData, setFormData] = useState(formConfig.initialData || {})
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [existingImage, setExistingImage] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({})
  const fileInputRef = useRef(null)

  // Initialize form data when config changes
  useEffect(() => {
    setFormData(formConfig.initialData || {})
    if (formConfig.imageField && formConfig.initialData[formConfig.imageField]) {
      setExistingImage(formConfig.initialData[formConfig.imageField])
    }
    if (formConfig.initialData?.user_avatar) {
      setExistingImage(formConfig.initialData.user_avatar)
    }
  }, [formConfig.initialData, formConfig.imageField])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Update password strength for password field (only if enabled)
    if (field === 'password' && showPasswordStrength) {
      const strength = checkPasswordStrength(value)
      setPasswordStrength(strength)
    }

    // Call custom onChange if provided
    const fieldConfig = formConfig.fields[field]
    if (fieldConfig?.onChange) {
      const result = fieldConfig.onChange(value)
      if (field === 'password' && result) {
        setPasswordStrength(result)
      }
    }
  }

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field])
        ? prev[field].map((item, i) => i === index ? value : item)
        : prev[field]
    }))
  }

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field])
        ? [...prev[field], '']
        : ['']
    }))
  }

  const removeArrayField = (field, index) => {
    if (Array.isArray(formData[field]) && formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        return
      }
      setSelectedFile(file)
      setFormData(prev => ({
        ...prev,
        [formConfig.imageField]: file
      }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    let isValid = true
    Object.keys(formConfig.fields).forEach(fieldName => {
      const fieldConfig = formConfig.fields[fieldName]
      const value = formData[fieldName]

      if (fieldConfig.required && (!value || (typeof value === 'string' && !value.trim()))) {
        isValid = false
      }
    })

    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    // Filter out empty strings from arrays
    const filteredData = { ...formData }
    formConfig.arrayFields?.forEach(field => {
      if (filteredData[field]) {
        filteredData[field] = filteredData[field].filter(item =>
          item && typeof item === 'string' && item.trim() !== ''
        )
      }
    })
    // Create FormData for file upload
    const formDataToSend = new FormData()
    // Add non-array, non-image fields first
    Object.keys(filteredData).forEach(key => {
      if (key !== formConfig.imageField &&
        !formConfig.arrayFields?.includes(key) &&
        filteredData[key] !== null &&
        filteredData[key] !== undefined) {
        formDataToSend.append(key, filteredData[key])
      }
    })
    // Add image file
    if (selectedFile) {
      formDataToSend.append(formConfig.imageField, selectedFile)
    }
    // Add arrays as JSON strings (always send, even if empty)
    formConfig.arrayFields?.forEach(field => {
      const arrayData = filteredData[field] || []
      formDataToSend.append(field, JSON.stringify(arrayData))
    })
    await onSubmit(formDataToSend)
  }

  const renderField = (fieldName, fieldConfig) => {
    const { type, required, placeholder, options, rows, icon, validation, onChange, ...otherProps } = fieldConfig
    const fieldValue = formData[fieldName] || ''

    // Get icon component
    const getIcon = () => {
      switch (icon) {
        case 'email': return <MdEmail className="absolute left-3 top-2.5 h-5 w-5" />
        case 'lock': return <MdLock className="absolute left-3 top-2.5 h-5 w-5" />
        case 'person': return <MdPerson className="absolute left-3 top-2.5 h-5 w-5" />
        default: return null
      }
    }

    // Render input with icon wrapper
    const renderInputWithIcon = (inputElement) => {
      if (!icon) return inputElement

      return (
        <div className="relative">
          {inputElement}
          {getIcon()}
          {type === 'password' && (
            <Icon
              onClick={() => setShowPassword(prev => ({ ...prev, [fieldName]: !prev[fieldName] }))}
              icon={showPassword[fieldName] ? <MdVisibilityOff /> : <MdVisibility />}
              color="simple"
              className="absolute right-1 top-0 h-full"
            />
          )}
        </div>
      )
    }

    switch (type) {
      case 'select':
        return (
          <SelectInput
            value={fieldValue}
            onChange={(value) => handleInputChange(fieldName, value)}
            options={options || []}
            placeholder={placeholder}
            searchable={fieldConfig.searchable}
            showFlags={fieldConfig.showFlags}
            className=""
          />
        )

      case 'image':
        const isAvatar = fieldName.includes('avatar') || fieldName.includes('profile')
        const containerClass = isAvatar ? "w-24 h-24 rounded-sm" : "w-32 h-32 rounded-sm"
        const iconSize = isAvatar ? "text-4xl" : "w-8 h-8"
        const editButtonClass = "absolute -bottom-2 -right-2 bg-gold hover:bg-gold/80 text-black p-2 rounded-full shadow-lg transition-colors"
        return (
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className={`${containerClass} overflow-hidden bg-stone-700 border-2 border-gold/30`}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : existingImage ? (
                  <img
                    src={existingImage}
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
                onClick={() => fileInputRef.current?.click()}
                className={editButtonClass}
                title="Upload Image"
              >
                <MdEdit size={isAvatar ? 16 : 16} />
              </button>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gold/30 text-gold border border-gold/30 rounded-md transition-colors flex items-center gap-2"
              >
                <MdUpload size={20} />
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </button>
              <p className="text-xs text-chino/70 mt-2">
                {fieldConfig.helpText || 'Upload an image (max 2MB).'}
              </p>
            </div>
          </div>
        )

      case 'textarea':
        return (
          <textarea
            required={required}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className=" h-40"
            {...otherProps}
          />
        )

      case 'additional':
        return (
          <AdditionalInput
            fields={formData[fieldName] || ['']}
            onChange={(index, value) => handleArrayFieldChange(fieldName, index, value)}
            onAdd={() => addArrayField(fieldName)}
            onRemove={(index) => removeArrayField(fieldName, index)}
            placeholder={placeholder}
            minFields={fieldConfig.minFields || 1}
            maxFields={fieldConfig.maxFields || 10}
          />
        )

      default:
        const inputElement = (
          <input
            type={type === 'password' ? (showPassword[fieldName] ? 'text' : 'password') : type}
            required={required}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={placeholder}
            className={`${icon ? 'pl-10' : ''}`}
            {...otherProps}
          />
        )
        return renderInputWithIcon(inputElement)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gold mb-4">Success!</h1>
        <p className="text-chino mb-6">{successMessage}</p>
        {onSuccessAction && (
          <Button
            text="Continue"
            onClick={onSuccessAction}
          />
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`space-y-2 w-full ${className}`}>
      {formConfig.sections?.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          {section.title && <Title text={section.title} />}
          <div className={section.gridClass || "grid grid-cols-1 md:grid-cols-1 gap-4"}>
            {section.fields?.map((fieldName) => {
              const fieldConfig = formConfig.fields[fieldName]
              if (!fieldConfig) return null
              return (
                <div key={fieldName}>
                  <label htmlFor={fieldName}>
                    {fieldConfig.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(fieldName, fieldConfig)}
                  {fieldName === 'password' && formData[fieldName] && showPasswordStrength && (
                    <PasswordStrengthIndicator
                      strength={passwordStrength}
                      password={formData[fieldName]}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {formConfig.imageField && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      )}
     <FlexBox type="row-between" className='mt-4'>
       <Button
        type="submit"
        text={isLoading ? "Submitting..." : submitButtonText}
        loading={isLoading}
        disabled={isLoading}
      />
       {showGoogle && <GoogleAuth />}
      </FlexBox>
    </form>
  )
}

export default SubmissionForm