import { InputNumber } from 'antd';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { NumberFieldSchema, DynamicFormValues } from '@/engines/dynamic-form/model/dynamic-form.types';

interface NumberFieldProps {
  field: NumberFieldSchema;
  controllerField: ControllerRenderProps<DynamicFormValues, string>;
  fieldState: ControllerFieldState;
  helpId: string;
}

export const NumberField = ({ field, controllerField, fieldState, helpId }: NumberFieldProps): ReactElement => {
  const getFormatProps = () => {
    switch (field.numberFormat) {
      case 'integer':
        return {
          precision: 0,
          formatter: (value: number | string | undefined) => value ? Math.round(Number(value)).toString() : '',
          parser: (value: string | undefined) => value ? parseInt(value, 10) : '',
        };
      case 'amount':
        return {
          formatter: (value: number | string | undefined) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '',
          parser: (value: string | undefined) => value ? value.replace(/\$\s?|(,*)/g, '') : '',
        };
      case 'decimal':
      default:
        return {};
    }
  };

  return (
    <InputNumber
      id={field.fieldName}
      aria-describedby={fieldState.error ? helpId : undefined}
      aria-invalid={Boolean(fieldState.error)}
      aria-label={field.label}
      className="w-full"
      controls={field.numberFormat !== 'amount'}
      disabled={field.disabled}
      min={field.validationRules?.min?.value}
      max={field.validationRules?.max?.value}
      placeholder={field.placeholder}
      step={field.step ?? (field.numberFormat === 'integer' ? 1 : undefined)}
      value={typeof controllerField.value === 'number' || typeof controllerField.value === 'string' ? Number(controllerField.value) : null}
      onBlur={controllerField.onBlur}
      onChange={(value) => {
        controllerField.onChange(value !== null && value !== undefined ? Number(value) : undefined);
      }}
      {...getFormatProps()}
    />
  );
};
