import { Button, Form } from 'antd';
import { FormProvider } from 'react-hook-form';
import type { ReactElement } from 'react';

import { useDynamicForm } from '@/engines/dynamic-form/hooks/useDynamicForm';
import type { DynamicFormRendererProps } from '@/engines/dynamic-form/model/dynamic-form.types';
import { DynamicFormField } from '@/engines/dynamic-form/ui/DynamicFormField';

export const DynamicFormRenderer = ({
  schema,
  submitLabel = 'Submit',
  className,
  isSubmitting = false,
  onSubmit,
}: DynamicFormRendererProps): ReactElement => {
  const { form } = useDynamicForm(schema);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <FormProvider {...form}>
      <Form layout="vertical" component={false}>
        <form className={className} noValidate onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {schema.map((field) => (
              <DynamicFormField
                key={field.fieldName}
                control={form.control}
                field={field}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              htmlType="submit"
              loading={isSubmitting || form.formState.isSubmitting}
              type="primary"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
};
