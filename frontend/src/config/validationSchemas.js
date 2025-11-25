import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod';

export const registerSchema = [
    toTypedSchema(z.object({
        email: z.string().email({ message: 'Invalid email address' }),
        firstName: z.string().min(1, { message: 'First name is required' }),
        middleName: z.string(),
        lastName: z.string().min(1, { message: 'Last name is required' }),
        suffix: z.string(),
        password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
        confirmPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
        contactNo: z.string().min(1, { message: 'Contact number is required' }),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })),
    toTypedSchema(z.object({
        companyName: z.string().min(1, { message: 'Company name is required' }),
        companyPosition: z.string().min(1, { message: 'Company position is required' }),
        companySize: z.string().min(1, { message: 'Company size is required' }),
        companyIndustry: z.string().min(1, { message: 'Company industry is required' }),
    })),
];

export const emailSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

// Helper function for optional string fields that can be null, undefined, or empty
const optionalString = (maxLength, fieldName) => {
    return z.union([
        z.string().max(maxLength, `${fieldName} must be less than ${maxLength} characters`),
        z.null(),
        z.undefined(),
        z.literal('')
    ]).optional();
};

// Helper function for optional URL fields
const optionalUrl = (maxLength, fieldName) => {
    return z.union([
        z.string().url(`${fieldName} must be a valid URL`).max(maxLength, `${fieldName} must be less than ${maxLength} characters`),
        z.null(),
        z.undefined(),
        z.literal('')
    ]).optional();
};

export const employeeSchema = z.object({
    employee_id: z.string()
        .min(1, 'Employee ID is required')
        .max(15, 'Employee ID must be less than 15 characters'),

    first_name: z.string()
        .min(1, 'First name is required')
        .max(100, 'First name must be less than 100 characters'),

    last_name: z.string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must be less than 100 characters'),

    middle_initial: optionalString(5, 'Middle initial'),

    suffix: optionalString(10, 'Suffix'),

    address: z.string()
        .min(1, 'Address is required')
        .max(255, 'Address must be less than 255 characters'),

    profile_url: optionalUrl(255, 'Profile URL'),

    contact_number: z.string()
        .min(1, 'Contact number is required')
        .max(255, 'Contact number must be less than 255 characters'),

    email: z.string()
        .email('Invalid email address'),

    access_level: z.number()
        .min(0, 'Access level is required')
        .max(1, 'Access level is required'),

    role_id: z.number({
        required_error: 'Role is required',
        invalid_type_error: 'Role must be selected',
    }),
});

export const roleSchema = z.object({
    role_name: z.string()
        .min(1, 'Role name is required')
        .max(100, 'Role name must be less than 100 characters'),
    role_description: optionalString(255, 'Role description'),
    permissions: z.array(z.string())
        .min(1, 'At least one permission is required')
});

// Helper function to convert string numbers to actual numbers
const numberField = (options = {}) => {
    return z.union([
        z.number(),
        z.string().transform((val) => {
            if (val === '' || val === null || val === undefined) return null;
            const num = parseFloat(val);
            return isNaN(num) ? val : num;
        })
    ]).pipe(
        z.number({
            required_error: options.required_error || 'This field is required',
            invalid_type_error: options.invalid_type_error || 'Must be a number',
        })
            .min(options.min || 0, options.min_message || 'Cannot be negative')
            .max(options.max || 999999.99, options.max_message || 'Value is too large')
    );
};

const optionalNumberField = (options = {}) => {
    return z.union([
        z.number(),
        z.string().transform((val) => {
            if (val === '' || val === null || val === undefined) return null;
            const num = parseFloat(val);
            return isNaN(num) ? val : num;
        }),
        z.null(),
        z.undefined()
    ]).pipe(
        z.number({
            invalid_type_error: options.invalid_type_error || 'Must be a number',
        })
            .min(options.min || 0, options.min_message || 'Cannot be negative')
            .max(options.max || 999999.99, options.max_message || 'Value is too large')
            .optional()
            .nullable()
    );
};

export const updatePayslipSchema = z.object({
    // Basic earnings
    total_basic_pay: numberField({
        required_error: 'Basic pay is required',
        invalid_type_error: 'Basic pay must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Basic pay cannot be negative',
        max_message: 'Basic pay is too large'
    }),

    additional_pay_results_overtime_pay_total_ot: optionalNumberField({
        invalid_type_error: 'Overtime pay must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Overtime pay cannot be negative',
        max_message: 'Overtime pay is too large'
    }),

    // Incentives
    incentives_services: optionalNumberField({
        invalid_type_error: 'Service incentive must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Service incentive cannot be negative',
        max_message: 'Service incentive is too large'
    }),

    incentives_products: optionalNumberField({
        invalid_type_error: 'Product incentive must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Product incentive cannot be negative',
        max_message: 'Product incentive is too large'
    }),

    transport_rate: optionalNumberField({
        invalid_type_error: 'Transport rate must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Transport rate cannot be negative',
        max_message: 'Transport rate is too large'
    }),

    // Total gain/salary
    total_salary: numberField({
        required_error: 'Total salary is required',
        invalid_type_error: 'Total salary must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Total salary cannot be negative',
        max_message: 'Total salary is too large'
    }),

    // Government deductions (Beneficials)
    deductions_other_deductions_sss: optionalNumberField({
        invalid_type_error: 'SSS deduction must be a number',
        min: 0,
        max: 99999.99,
        min_message: 'SSS deduction cannot be negative',
        max_message: 'SSS deduction is too large'
    }),

    deductions_other_deductions_philhealth: optionalNumberField({
        invalid_type_error: 'PhilHealth deduction must be a number',
        min: 0,
        max: 99999.99,
        min_message: 'PhilHealth deduction cannot be negative',
        max_message: 'PhilHealth deduction is too large'
    }),

    deductions_other_deductions_pagibig: optionalNumberField({
        invalid_type_error: 'Pag-Ibig deduction must be a number',
        min: 0,
        max: 99999.99,
        min_message: 'Pag-Ibig deduction cannot be negative',
        max_message: 'Pag-Ibig deduction is too large'
    }),

    // Other deductions
    deduction_results_total_late_deduction: optionalNumberField({
        invalid_type_error: 'Late deduction must be a number',
        min: 0,
        max: 99999.99,
        min_message: 'Late deduction cannot be negative',
        max_message: 'Late deduction is too large'
    }),

    deductions_other_deductions_others: optionalNumberField({
        invalid_type_error: 'Cash bond must be a number',
        min: 0,
        max: 99999.99,
        min_message: 'Cash bond cannot be negative',
        max_message: 'Cash bond is too large'
    }),

    deduction_results_other_deductions: optionalNumberField({
        invalid_type_error: 'Other deductions must be a number',
        min: 0,
        max: 99999.99,
        min_message: 'Other deductions cannot be negative',
        max_message: 'Other deductions is too large'
    }),

    // Total deductions
    deduction: numberField({
        required_error: 'Total deductions is required',
        invalid_type_error: 'Total deductions must be a number',
        min: 0,
        max: 999999.99,
        min_message: 'Total deductions cannot be negative',
        max_message: 'Total deductions is too large'
    }),
})
