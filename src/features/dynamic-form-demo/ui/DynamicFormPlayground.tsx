import { message } from 'antd';
import type { ReactElement } from 'react';

import { DynamicFormRenderer } from '@/engines/dynamic-form';
import { userFormMetadataResponse } from '@/features/dynamic-form-demo/metadata/user-form.metadata';
import { useFormSubmissionStore } from '@/features/dynamic-form-demo/store/useFormSubmissionStore';
import { SectionCard } from '@/shared/ui/SectionCard';

export const DynamicFormPlayground = (): ReactElement => {
  const [messageApi, contextHolder] = message.useMessage();
  const lastSubmission = useFormSubmissionStore((state) => state.lastSubmission);
  const setLastSubmission = useFormSubmissionStore(
    (state) => state.setLastSubmission,
  );

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {contextHolder}

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <section className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-teal-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-50">
              Fitly Platform / Metadata-driven UI
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Dynamic form engine for enterprise ERP workflows
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Backend metadata defines the fields, validation, and defaults.
                The renderer stays generic so your Users, Purchase Orders, and
                Permissions modules can share the same engine.
              </p>
            </div>
          </div>

          <SectionCard title="User onboarding form">
            <DynamicFormRenderer
              schema={userFormMetadataResponse.fields}
              submitLabel="Save user profile"
              onSubmit={(values) => {
                setLastSubmission(values);
                messageApi.success('Metadata-driven form submitted successfully.');
              }}
            />
          </SectionCard>
        </section>

        <aside className="space-y-6">
          <SectionCard title="Mock backend metadata">
            <pre className="overflow-auto rounded-xl bg-slate-950/95 p-4 text-xs leading-6 text-teal-100">
              {JSON.stringify(userFormMetadataResponse, null, 2)}
            </pre>
          </SectionCard>

          <SectionCard title="Latest submission snapshot">
            <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-6 text-slate-100">
              {lastSubmission
                ? JSON.stringify(lastSubmission, null, 2)
                : 'No submission yet'}
            </pre>
          </SectionCard>
        </aside>
      </div>
    </main>
  );
};
