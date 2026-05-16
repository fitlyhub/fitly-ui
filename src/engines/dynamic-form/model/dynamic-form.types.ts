import type { InputHTMLAttributes } from 'react';

export type DynamicFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multi-select'
  | 'checkbox'
  | 'switch';

export type NumberFormatType = 'integer' | 'decimal' | 'amount';

export interface ValidationRuleConfig<TValue> {
  value: TValue;
  message?: string;
}

export interface DynamicValidationRules {
  required?: ValidationRuleConfig<boolean>;
  min?: ValidationRuleConfig<number>;
  max?: ValidationRuleConfig<number>;
  minLength?: ValidationRuleConfig<number>;
  maxLength?: ValidationRuleConfig<number>;
  pattern?: ValidationRuleConfig<string>;
}

export interface BaseFieldSchema<TName extends string = string> {
  fieldName: TName;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  validationRules?: DynamicValidationRules;
}

export interface TextFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'text';
  defaultValue?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
}

export interface NumberFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'number';
  defaultValue?: number;
  step?: number;
  numberFormat?: NumberFormatType;
}

export interface DateFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'date';
  defaultValue?: string;
  format?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'select';
  defaultValue?: string | number;
  options: SelectOption[];
}

export interface MultiSelectFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'multi-select';
  defaultValue?: (string | number)[];
  options: SelectOption[];
}

export interface CheckboxFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'checkbox';
  defaultValue?: boolean;
}

export interface SwitchFieldSchema<TName extends string = string>
  extends BaseFieldSchema<TName> {
  type: 'switch';
  defaultValue?: boolean;
  checkedChildren?: string;
  unCheckedChildren?: string;
}

export type DynamicFormFieldSchema<TName extends string = string> =
  | TextFieldSchema<TName>
  | NumberFieldSchema<TName>
  | DateFieldSchema<TName>
  | SelectFieldSchema<TName>
  | MultiSelectFieldSchema<TName>
  | CheckboxFieldSchema<TName>
  | SwitchFieldSchema<TName>;

export type DynamicFormValue =
  | string
  | number
  | boolean
  | (string | number)[]
  | undefined;

export type DynamicFormValues = Record<string, DynamicFormValue>;

export interface BackendFormMetadataResponse {
  entity: string;
  version: number;
  fields: DynamicFormFieldSchema[];
}

export interface DynamicFormRendererProps {
  schema: DynamicFormFieldSchema[];
  submitLabel?: string;
  className?: string;
  isSubmitting?: boolean;
  onSubmit: (values: DynamicFormValues) => void | Promise<void>;
}
