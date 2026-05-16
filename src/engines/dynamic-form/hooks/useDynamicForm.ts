import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, type Resolver, type UseFormReturn } from 'react-hook-form';

import {
  buildDefaultValues,
  buildDynamicFormSchema,
} from '@/engines/dynamic-form/model/dynamic-form.schema';
import type {
  DynamicFormFieldSchema,
  DynamicFormValues,
} from '@/engines/dynamic-form/model/dynamic-form.types';

interface UseDynamicFormResult {
  form: UseFormReturn<DynamicFormValues>;
  defaultValues: DynamicFormValues;
}

export const useDynamicForm = (
  schema: DynamicFormFieldSchema[],
): UseDynamicFormResult => {
  const validationSchema = useMemo(() => buildDynamicFormSchema(schema), [schema]);
  const defaultValues = useMemo(() => buildDefaultValues(schema), [schema]);

  const form = useForm<DynamicFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues,
    resolver: zodResolver(validationSchema) as Resolver<DynamicFormValues>,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return {
    form,
    defaultValues,
  };
};
