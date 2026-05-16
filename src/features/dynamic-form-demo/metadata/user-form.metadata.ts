import type { BackendFormMetadataResponse } from '@/engines/dynamic-form';

export const userFormMetadataResponse = {
  entity: 'user',
  version: 1,
  fields: [
    {
      fieldName: 'fullName',
      label: 'Full name',
      type: 'text',
      placeholder: 'e.g. Avery Nguyen',
      defaultValue: '',
      description: 'This value is shown across audit trails and approval workflows.',
      validationRules: {
        required: {
          value: true,
          message: 'Full name is required',
        },
        minLength: {
          value: 3,
          message: 'Use at least 3 characters',
        },
      },
    },
    {
      fieldName: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '18',
      defaultValue: 25,
      validationRules: {
        required: {
          value: true,
          message: 'Age is required',
        },
        min: {
          value: 18,
          message: 'Age must be 18 or above',
        },
        max: {
          value: 70,
          message: 'Age must stay under the retirement threshold',
        },
      },
    },
    {
      fieldName: 'startDate',
      label: 'Start date',
      type: 'date',
      placeholder: 'Select a start date',
      defaultValue: '2026-05-14',
      validationRules: {
        required: {
          value: true,
          message: 'Start date is required',
        },
      },
    },
    {
      fieldName: 'employmentType',
      label: 'Employment type',
      type: 'select',
      placeholder: 'Choose employment type',
      defaultValue: 'full_time',
      options: [
        {
          label: 'Full-time',
          value: 'full_time',
        },
        {
          label: 'Contractor',
          value: 'contractor',
        },
        {
          label: 'Intern',
          value: 'intern',
        },
      ],
      validationRules: {
        required: {
          value: true,
          message: 'Employment type is required',
        },
      },
    },
  ],
} satisfies BackendFormMetadataResponse;
