import { Input } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { TextFieldSchema, DynamicFormValues } from '@/engines/dynamic-form/model/dynamic-form.types';

interface TextFieldProps {
  field: TextFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
}

export const TextField = ({ field, controllerField, fieldState, helpId }: TextFieldProps): ReactElement => {
  return (
    <Input
      id={field.fieldName}
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      autoComplete="off"
      disabled={field.disabled}
      inputMode={field.inputMode}
      placeholder={field.placeholder}
      value={typeof controllerField.value === 'string' ? controllerField.value : ''}
      onBlur={controllerField.onBlur}
      onChange={(event) => {
        controllerField.onChange(event.target.value);
      }}
    />
  );
};
