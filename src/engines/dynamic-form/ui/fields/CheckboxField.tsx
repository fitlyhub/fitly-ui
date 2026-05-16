import { Checkbox } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { CheckboxFieldSchema, DynamicFormValues } from '@/engines/dynamic-form/model/dynamic-form.types';

interface CheckboxFieldProps {
  field: CheckboxFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
}

export const CheckboxField = ({ field, controllerField, fieldState, helpId }: CheckboxFieldProps): ReactElement => {
  return (
    <Checkbox
      id={field.fieldName}
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      disabled={field.disabled}
      checked={Boolean(controllerField.value)}
      onBlur={controllerField.onBlur}
      onChange={(e) => {
        controllerField.onChange(e.target.checked);
      }}
    >
      {field.placeholder || field.label}
    </Checkbox>
  );
};
