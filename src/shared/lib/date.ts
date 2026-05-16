import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

export const toDatePickerValue = (
  value?: string,
  format = DEFAULT_DATE_FORMAT,
): Dayjs | null => {
  if (!value) {
    return null;
  }

  const strictValue = dayjs(value, format, true);

  if (strictValue.isValid()) {
    return strictValue;
  }

  const looseValue = dayjs(value);

  return looseValue.isValid() ? looseValue : null;
};

export const fromDatePickerValue = (
  value: Dayjs | null,
  format = DEFAULT_DATE_FORMAT,
): string | undefined => {
  return value ? value.format(format) : undefined;
};

export const isDateString = (
  value: string,
  format = DEFAULT_DATE_FORMAT,
): boolean => {
  return dayjs(value, format, true).isValid();
};
