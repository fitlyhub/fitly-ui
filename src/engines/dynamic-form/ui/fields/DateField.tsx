import { DatePicker } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { DateFieldSchema, DynamicFormValues } from '@/engines/dynamic-form/model/dynamic-form.types';
import { DEFAULT_DATE_FORMAT, fromDatePickerValue, toDatePickerValue } from '@/shared/lib/date';

interface DateFieldProps {
  field: DateFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
}

export const DateField = ({ field, controllerField, fieldState, helpId }: DateFieldProps): ReactElement => {
  return (
    <DatePicker
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      className="w-full"
      disabled={field.disabled}
      format={field.format ?? DEFAULT_DATE_FORMAT}
      id={field.fieldName}
      placeholder={field.placeholder}
      value={
        typeof controllerField.value === 'string'
          ? toDatePickerValue(controllerField.value, field.format ?? DEFAULT_DATE_FORMAT)
          : null
      }
      onBlur={controllerField.onBlur}
      onChange={(value) => {
        controllerField.onChange(fromDatePickerValue(value, field.format ?? DEFAULT_DATE_FORMAT));
      }}
    />
  );
};
