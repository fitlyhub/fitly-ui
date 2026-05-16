import { Controller, type Control } from 'react-hook-form';
import { Form } from 'antd';
import type { ReactElement } from 'react';

import type {
  DynamicFormFieldSchema,
  DynamicFormValues,
} from '@/engines/dynamic-form/model/dynamic-form.types';
import { TextField } from './fields/TextField';
import { NumberField } from './fields/NumberField';
import { DateField } from './fields/DateField';
import { SelectField } from './fields/SelectField';
import { MultiSelectField } from './fields/MultiSelectField';
import { CheckboxField } from './fields/CheckboxField';
import { SwitchField } from './fields/SwitchField';

interface DynamicFormFieldProps {
  field: DynamicFormFieldSchema;
  control: Control<DynamicFormValues>;
}

const isRequired = (field: DynamicFormFieldSchema): boolean => {
  return field.validationRules?.required?.value ?? false;
};

export const DynamicFormField = ({
  field,
  control,
}: DynamicFormFieldProps): ReactElement => {
  const helpId = `${field.fieldName}-error`;
  const required = isRequired(field);

  return (
    <Controller
      name={field.fieldName}
      control={control}
      render={({ field: controllerField, fieldState }) => (
        <Form.Item
          htmlFor={field.fieldName}
          label={field.label}
          required={required}
          validateStatus={fieldState.error ? 'error' : undefined}
          help={null}
          extra={!fieldState.error ? field.description : undefined}
        >
          <div data-testid={`dynamic-field-${field.fieldName}`}>
            {(() => {
              switch (field.type) {
                case 'text':
                  return (
                    <TextField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                    />
                  );
                case 'number':
                  return (
                    <NumberField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                    />
                  );
                case 'date':
                  return (
                    <DateField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                    />
                  );
                case 'select':
                  return (
                    <SelectField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                      isRequired={required}
                    />
                  );
                case 'multi-select':
                  return (
                    <MultiSelectField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                      isRequired={required}
                    />
                  );
                case 'checkbox':
                  return (
                    <CheckboxField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                    />
                  );
                case 'switch':
                  return (
                    <SwitchField
                      field={field}
                      controllerField={controllerField}
                      fieldState={fieldState}
                      helpId={helpId}
                    />
                  );
              }
            })()}
          </div>

          {fieldState.error ? (
            <p
              aria-live="polite"
              className="mt-1 text-sm font-medium text-red-600"
              id={helpId}
              role="alert"
            >
              {fieldState.error.message}
            </p>
          ) : null}
        </Form.Item>
      )}
    />
  );
};
