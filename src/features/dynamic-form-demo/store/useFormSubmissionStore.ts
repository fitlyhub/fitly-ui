import { create } from 'zustand';

import type { DynamicFormValues } from '@/engines/dynamic-form';

interface FormSubmissionState {
  lastSubmission: DynamicFormValues | null;
  setLastSubmission: (values: DynamicFormValues) => void;
}

export const useFormSubmissionStore = create<FormSubmissionState>((set) => ({
  lastSubmission: null,
  setLastSubmission: (values) => {
    set({ lastSubmission: values });
  },
}));
