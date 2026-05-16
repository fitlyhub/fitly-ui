import { z } from 'zod';

import {
  type DateFieldSchema,
  type DynamicFormFieldSchema,
  type DynamicFormValue,
  type DynamicFormValues,
  type DynamicValidationRules,
  type NumberFieldSchema,
  type SelectFieldSchema,
  type TextFieldSchema,
  type MultiSelectFieldSchema,
  type CheckboxFieldSchema,
  type SwitchFieldSchema,
  type ValidationRuleConfig,
} from '@/engines/dynamic-form/model/dynamic-form.types';
import { DEFAULT_DATE_FORMAT, isDateString } from '@/shared/lib/date';

type DynamicValueSchema<TValue extends DynamicFormValue = DynamicFormValue> =
  z.ZodType<TValue>;

const getRuleMessage = <TValue>(
  rule: ValidationRuleConfig<TValue> | undefined,
  fallbackMessage: string,
): string => {
  return rule?.message ?? fallbackMessage;
};

const buildTextFieldSchema = (field: TextFieldSchema): DynamicValueSchema<string> => {
  const rules = field.validationRules;
  let schema = z
    .string()
    .transform((value) => value.trim());

  if (rules?.required?.value) {
    schema = schema.refine((value) => value.length > 0, {
      message: getRuleMessage(
        rules.required,
        `${field.label} is required`,
      ),
    }) as any;
  }

  if (rules?.minLength) {
    schema = schema.refine(
      (value) =>
        value.length === 0 || value.length >= rules.minLength!.value,
      {
        message: getRuleMessage(
          rules.minLength,
          `${field.label} must be at least ${rules.minLength.value} characters`,
        ),
      },
    ) as any;
  }

  if (rules?.maxLength) {
    schema = schema.refine(
      (value) =>
        value.length === 0 || value.length <= rules.maxLength!.value,
      {
        message: getRuleMessage(
          rules.maxLength,
          `${field.label} must be at most ${rules.maxLength.value} characters`,
        ),
      },
    ) as any;
  }

  if (rules?.pattern) {
    schema = schema.refine(
      (value) =>
        value.length === 0 || new RegExp(rules.pattern!.value).test(value),
      {
        message: getRuleMessage(
          rules.pattern,
          `${field.label} has an invalid format`,
        ),
      },
    ) as any;
  }

  return schema as unknown as DynamicValueSchema<string>;
};

const buildNumberFieldSchema = (
  field: NumberFieldSchema,
): DynamicValueSchema<number | undefined> => {
  const rules = field.validationRules;
  let schema = z.number().optional();

  if (rules?.required?.value) {
    schema = schema.refine((value) => value !== undefined && value !== null, {
      message: getRuleMessage(
        rules.required,
        `${field.label} is required`,
      ),
    }) as any;
  }

  if (rules?.min) {
    schema = schema.refine(
      (value) => value === undefined || value === null || value >= rules.min!.value,
      {
        message: getRuleMessage(
          rules.min,
          `${field.label} must be at least ${rules.min.value}`,
        ),
      },
    ) as any;
  }

  if (rules?.max) {
    schema = schema.refine(
      (value) => value === undefined || value === null || value <= rules.max!.value,
      {
        message: getRuleMessage(
          rules.max,
          `${field.label} must be at most ${rules.max.value}`,
        ),
      },
    ) as any;
  }

  return schema as unknown as DynamicValueSchema<number | undefined>;
};

const buildDateFieldSchema = (
  field: DateFieldSchema,
): DynamicValueSchema<string | undefined> => {
  const rules = field.validationRules;
  let schema = z.string().optional();

  if (rules?.required?.value) {
    schema = schema.refine(
      (value) => typeof value === 'string' && value.length > 0,
      {
        message: getRuleMessage(
          rules.required,
          `${field.label} is required`,
        ),
      },
    ) as any;
  }

  schema = schema.refine(
    (value) =>
      value === undefined || value === null || value === '' || isDateString(value, field.format ?? DEFAULT_DATE_FORMAT),
    {
      message: `${field.label} must match ${field.format ?? DEFAULT_DATE_FORMAT}`,
    },
  ) as any;

  return schema as unknown as DynamicValueSchema<string | undefined>;
};

const buildSelectFieldSchema = (
  field: SelectFieldSchema,
): DynamicValueSchema<string | number | undefined> => {
  const rules = field.validationRules;
  const options = new Set(field.options.map((option) => option.value));
  let schema = z
    .union([z.string(), z.number()])
    .optional();

  if (rules?.required?.value) {
    schema = schema.refine(
      (value) => value !== undefined && value !== null && value !== '',
      {
        message: getRuleMessage(
          rules.required,
          `${field.label} is required`,
        ),
      },
    ) as any;
  }

  schema = schema.refine(
    (value) => value === undefined || value === null || value === '' || options.has(value as string | number),
    {
      message: `${field.label} must match one of the allowed options`,
    },
  ) as any;

  return schema as unknown as DynamicValueSchema<string | number | undefined>;
};

const buildMultiSelectFieldSchema = (
  field: MultiSelectFieldSchema,
): DynamicValueSchema<(string | number)[] | undefined> => {
  const rules = field.validationRules;
  const options = new Set(field.options.map((option) => option.value));
  let schema = z
    .array(z.union([z.string(), z.number()]))
    .optional();

  if (rules?.required?.value) {
    schema = schema.refine(
      (value) => value !== undefined && value !== null && value.length > 0,
      {
        message: getRuleMessage(
          rules.required,
          `${field.label} is required`,
        ),
      },
    ) as any;
  }

  schema = schema.refine(
    (value) => value === undefined || value === null || value.every(item => options.has(item)),
    {
      message: `${field.label} must only contain allowed options`,
    },
  ) as any;

  return schema as unknown as DynamicValueSchema<(string | number)[] | undefined>;
};

const buildCheckboxFieldSchema = (
  field: CheckboxFieldSchema,
): DynamicValueSchema<boolean | undefined> => {
  const rules = field.validationRules;
  let schema = z.boolean().optional();

  if (rules?.required?.value) {
    schema = schema.refine(
      (value) => value === true,
      {
        message: getRuleMessage(
          rules.required,
          `${field.label} must be checked`,
        ),
      },
    ) as any;
  }

  return schema as unknown as DynamicValueSchema<boolean | undefined>;
};

const buildSwitchFieldSchema = (
  field: SwitchFieldSchema,
): DynamicValueSchema<boolean | undefined> => {
  const rules = field.validationRules;
  let schema = z.boolean().optional();

  if (rules?.required?.value) {
    schema = schema.refine(
      (value) => value === true,
      {
        message: getRuleMessage(
          rules.required,
          `${field.label} must be checked`,
        ),
      },
    ) as any;
  }

  return schema as unknown as DynamicValueSchema<boolean | undefined>;
};


const buildFieldSchema = (
  field: DynamicFormFieldSchema,
): DynamicValueSchema => {
  switch (field.type) {
    case 'text':
      return buildTextFieldSchema(field) as unknown as DynamicValueSchema;
    case 'number':
      return buildNumberFieldSchema(field) as unknown as DynamicValueSchema;
    case 'date':
      return buildDateFieldSchema(field) as unknown as DynamicValueSchema;
    case 'select':
      return buildSelectFieldSchema(field) as unknown as DynamicValueSchema;
    case 'multi-select':
      return buildMultiSelectFieldSchema(field) as unknown as DynamicValueSchema;
    case 'checkbox':
      return buildCheckboxFieldSchema(field) as unknown as DynamicValueSchema;
    case 'switch':
      return buildSwitchFieldSchema(field) as unknown as DynamicValueSchema;
  }
};

export const buildDynamicFormSchema = (
  fields: DynamicFormFieldSchema[],
): z.ZodObject<Record<string, DynamicValueSchema>> => {
  const shape: Record<string, DynamicValueSchema> = {};

  for (const field of fields) {
    shape[field.fieldName] = buildFieldSchema(field);
  }

  return z.object(shape);
};

const getDefaultFieldValue = (
  field: DynamicFormFieldSchema,
): DynamicFormValue => {
  switch (field.type) {
    case 'text':
      return field.defaultValue ?? '';
    case 'number':
      return field.defaultValue;
    case 'date':
      return field.defaultValue;
    case 'select':
      return field.defaultValue;
    case 'multi-select':
      return field.defaultValue ?? [];
    case 'checkbox':
      return field.defaultValue ?? false;
    case 'switch':
      return field.defaultValue ?? false;
  }
};

export const buildDefaultValues = (
  fields: DynamicFormFieldSchema[],
): DynamicFormValues => {
  return fields.reduce<DynamicFormValues>((defaults, field) => {
    defaults[field.fieldName] = getDefaultFieldValue(field);
    return defaults;
  }, {});
};
