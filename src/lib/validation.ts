import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  min?: number;
  max?: number;
  email?: boolean;
  url?: boolean;
  date?: boolean;
  number?: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (value: any, rules: ValidationRule, fieldName: string): string | null => {
  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} is required`;
  }

  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }

  // String length validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }
  }

  // Number validations
  if (rules.number || rules.min !== undefined || rules.max !== undefined) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return `${fieldName} must be a valid number`;
    }
    if (rules.min !== undefined && numValue < rules.min) {
      return `${fieldName} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && numValue > rules.max) {
      return `${fieldName} must be no more than ${rules.max}`;
    }
  }

  // Email validation
  if (rules.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
  }

  // URL validation
  if (rules.url) {
    try {
      new URL(value);
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  }

  // Date validation
  if (rules.date) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`;
    }
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationErrors => {
  const errors: ValidationErrors = {};

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[fieldName], fieldRules, fieldName);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
};

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { required: true, email: true },
  password: { required: true, minLength: 8 },
  phone: { 
    required: true, 
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    custom: (value: string) => {
      if (value.length < 10) return 'Phone number must be at least 10 digits';
      return null;
    }
  },
  positiveNumber: { required: true, number: true, min: 0 },
  currency: { required: true, number: true, min: 0 },
  date: { required: true, date: true },
  projectName: { required: true, minLength: 3, maxLength: 100 },
  description: { maxLength: 500 },
  url: { url: true },
};

// Form validation hook
export const useFormValidation = (initialData: Record<string, any>, rules: Record<string, ValidationRule>) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(() => {
    const validationErrors = validateForm(data, rules);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [data, rules]);

  const setFieldValue = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field: string) => {
    const fieldRules = rules[field];
    if (!fieldRules) return;

    const error = validateField(data[field], fieldRules, field);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  }, [data, rules]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const isValid = Object.keys(errors).length === 0 && Object.keys(data).every(key => {
    const fieldRules = rules[key];
    if (!fieldRules) return true;
    return !fieldRules.required || (data[key] && data[key].toString().trim() !== '');
  });

  return {
    data,
    errors,
    touched,
    isValid,
    validate,
    setFieldValue,
    setFieldTouched,
    validateField,
    reset,
  };
};
