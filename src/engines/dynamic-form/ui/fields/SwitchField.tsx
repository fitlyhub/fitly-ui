import { Switch } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { SwitchFieldSchema, DynamicFormValues } from '@/engines/dynamic-form/model/dynamic-form.types';

interface SwitchFieldProps {
  field: SwitchFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
}

export const SwitchField = ({ field, controllerField, fieldState, helpId }: SwitchFieldProps): ReactElement => {
  return (
    <Switch
      id={field.fieldName}
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      disabled={field.disabled}
      checkedChildren={field.checkedChildren}
      unCheckedChildren={field.unCheckedChildren}
      checked={Boolean(controllerField.value)}
      onChange={(checked) => {
        controllerField.onChange(checked);
      }}
    />
  );
};
