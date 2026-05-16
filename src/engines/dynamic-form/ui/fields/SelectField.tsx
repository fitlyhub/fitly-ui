import { Select } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { SelectFieldSchema, DynamicFormValues } from '@/engines/dynamic-form/model/dynamic-form.types';

interface SelectFieldProps {
  field: SelectFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
  isRequired: boolean;
}

export const SelectField = ({ field, controllerField, fieldState, helpId, isRequired }: SelectFieldProps): ReactElement => {
  return (
    <Select
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      allowClear={!isRequired}
      disabled={field.disabled}
      options={field.options}
      placeholder={field.placeholder}
      showSearch
      value={
        typeof controllerField.value === 'string' || typeof controllerField.value === 'number'
          ? controllerField.value
          : undefined
      }
      onBlur={controllerField.onBlur}
      onChange={(value) => {
        controllerField.onChange(value);
      }}
      onClear={() => {
        controllerField.onChange(undefined);
      }}
    />
  );
};
