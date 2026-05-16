import { Select } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { MultiSelectFieldSchema, DynamicFormValues } from '../../model/dynamic-form.types';

interface MultiSelectFieldProps {
  field: MultiSelectFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
  isRequired: boolean;
}

export const MultiSelectField = ({
  field,
  controllerField,
  fieldState,
  helpId,
  isRequired,
}: MultiSelectFieldProps): ReactElement => {
  return (
    <Select
      mode="multiple"
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      allowClear={!isRequired}
      disabled={field.disabled}
      options={field.options}
      placeholder={field.placeholder}
      showSearch
      value={Array.isArray(controllerField.value) ? controllerField.value : []}
      onBlur={controllerField.onBlur}
      onChange={(value) => {
        controllerField.onChange(value);
      }}
      onClear={() => {
        controllerField.onChange([]);
      }}
    />
  );
};
