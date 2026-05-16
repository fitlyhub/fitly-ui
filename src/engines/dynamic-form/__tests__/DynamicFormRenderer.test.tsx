import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DynamicFormRenderer, type DynamicFormFieldSchema } from '@/engines/dynamic-form';
import { renderWithProviders } from '@/test/test-utils';

const fullSchema: DynamicFormFieldSchema[] = [
  {
    fieldName: 'fullName',
    label: 'Full name',
    type: 'text',
    defaultValue: 'Avery Nguyen',
    validationRules: {
      required: {
        value: true,
        message: 'Full name is required',
      },
    },
  },
  {
    fieldName: 'age',
    label: 'Age',
    type: 'number',
    defaultValue: 26,
    validationRules: {
      required: {
        value: true,
        message: 'Age is required',
      },
      min: {
        value: 18,
        message: 'Age must be 18 or above',
      },
    },
  },
  {
    fieldName: 'startDate',
    label: 'Start date',
    type: 'date',
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
    ],
    validationRules: {
      required: {
        value: true,
        message: 'Employment type is required',
      },
    },
  },
];

describe('DynamicFormRenderer', () => {
  it('renders fields from metadata and seeds default values', () => {
    renderWithProviders(
      <DynamicFormRenderer onSubmit={vi.fn()} schema={fullSchema} />,
    );

    expect(screen.getByTestId('dynamic-field-fullName')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-field-age')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-field-startDate')).toBeInTheDocument();
    expect(
      screen.getByTestId('dynamic-field-employmentType'),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Full name')).toHaveValue('Avery Nguyen');
    expect(screen.getByLabelText('Age')).toHaveValue('26');
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-05-14');
    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  it('shows validation messages when required inputs are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <DynamicFormRenderer
        onSubmit={onSubmit}
        schema={[
          {
            fieldName: 'fullName',
            label: 'Full name',
            type: 'text',
            defaultValue: '',
            validationRules: {
              required: {
                value: true,
                message: 'Full name is required',
              },
            },
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits normalized values from the schema-driven form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <DynamicFormRenderer
        onSubmit={onSubmit}
        schema={[
          {
            fieldName: 'fullName',
            label: 'Full name',
            type: 'text',
            defaultValue: '',
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
            defaultValue: undefined,
            validationRules: {
              required: {
                value: true,
                message: 'Age is required',
              },
              min: {
                value: 18,
                message: 'Age must be 18 or above',
              },
            },
          },
        ]}
      />,
    );

    await user.type(screen.getByLabelText('Full name'), '  Morgan Tran  ');
    await user.type(screen.getByLabelText('Age'), '32');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        age: 32,
        fullName: 'Morgan Tran',
      });
    });
  });
});
