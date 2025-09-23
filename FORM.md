# Reusable Form System

A comprehensive, professional form system built for the DJ app with validation, error handling, and extensibility.

## Components

### 1. SubmissionForm

The main form component that handles all form types and validation.

**Props:**

- `formConfig` - Form configuration object
- `onSubmit` - Submit handler function
- `isLoading` - Loading state
- `error` - Global error message
- `success` - Success state
- `onSuccessAction` - Success action callback
- `successMessage` - Success message text
- `submitButtonText` - Submit button text
- `className` - Additional CSS classes
- `validation` - Custom validation object
- `customValidation` - Custom validation function

### 2. SelectInput

Enhanced select component with search and flags support.

**Props:**

- `value` - Selected value
- `onChange` - Change handler
- `options` - Array of options (string or object)
- `placeholder` - Placeholder text
- `searchable` - Enable search functionality
- `showFlags` - Show country flags
- `className` - Additional CSS classes

### 3. AdditionalInput

Dynamic input fields with add/remove functionality.

**Props:**

- `fields` - Array of field values
- `onChange` - Change handler
- `onAdd` - Add field handler
- `onRemove` - Remove field handler
- `placeholder` - Placeholder text
- `minFields` - Minimum number of fields
- `maxFields` - Maximum number of fields

### 4. PasswordStrengthIndicator

Password strength visualization component.

**Props:**

- `strength` - Strength object with score, feedback, color
- `password` - Password value

## Form Configuration

### Basic Structure

```javascript
const formConfig = {
  initialData: {
    field1: "",
    field2: "",
  },
  fields: {
    field1: {
      type: "text",
      required: true,
      label: "Field Label",
      placeholder: "Enter value",
      validation: (value) => (value ? null : "Error message"),
    },
  },
  sections: [
    {
      title: "Section Title",
      fields: ["field1", "field2"],
      gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
    },
  ],
};
```

### Field Types

- `text` - Text input
- `email` - Email input with validation
- `password` - Password input with visibility toggle
- `date` - Date picker
- `textarea` - Multi-line text
- `select` - Dropdown selection
- `image` - File upload with preview
- `avatar` - Profile picture upload
- `additional` - Dynamic input arrays

### Field Properties

- `type` - Field type
- `required` - Required field
- `label` - Field label
- `placeholder` - Placeholder text
- `icon` - Icon type (email, lock, person)
- `validation` - Validation function
- `onChange` - Custom change handler
- `helpText` - Help text below field
- `fullWidth` - Full width field
- `searchable` - Enable search (for select)
- `showFlags` - Show flags (for select)
- `minFields` - Min fields (for additional)
- `maxFields` - Max fields (for additional)

## Pre-configured Forms

Use `formConfigs` from `@/app/helpers/formData/formConfigs`:

- `formConfigs.signIn` - Sign in form
- `formConfigs.signUp` - Sign up form
- `formConfigs.userProfile` - User profile form
- `formConfigs.addArtist` - Add artist form

## Validation

### Built-in Validators

```javascript
import { validators } from "@/app/helpers/formData/formFields";

// Use in field configuration
email: {
  validation: validators.email;
}
```

### Custom Validation

```javascript
const customValidation = (formData) => {
  const errors = {};

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
```

## Usage Examples

### Basic Form

```javascript
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import { formConfigs } from "@/app/helpers/formData/formConfigs";

const MyForm = () => {
  const handleSubmit = async (formData) => {
    // Handle form submission
  };

  return (
    <SubmissionForm
      formConfig={formConfigs.signIn}
      onSubmit={handleSubmit}
      submitButtonText="Sign In"
    />
  );
};
```

### Custom Form

```javascript
const customFormConfig = {
  initialData: { name: "", email: "" },
  fields: {
    name: {
      type: "text",
      required: true,
      label: "Name",
      validation: validators.required,
    },
    email: {
      type: "email",
      required: true,
      label: "Email",
      validation: validators.email,
    },
  },
  sections: [
    {
      fields: ["name", "email"],
    },
  ],
};
```

## Styling

The form system uses your existing global input styles. No additional styling is required. All components respect your design system and dark mode.

## Extensibility

### Adding New Field Types

1. Add case to `renderField` function in `SubmissionForm.jsx`
2. Create component if needed
3. Update field configuration

### Adding New Validators

1. Add to `validators` object in `formFields.js`
2. Use in field configuration

### Creating New Form Types

1. Add to `formConfigs` object in `formConfigs.js`
2. Use `createFormConfig` helper for variations
3. Use `addValidation` helper for validation rules
