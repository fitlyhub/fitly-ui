import { Card, type CardProps } from 'antd';
import type { PropsWithChildren, ReactElement } from 'react';

type SectionCardProps = PropsWithChildren<CardProps>;

export const SectionCard = ({
  children,
  className,
  ...props
}: SectionCardProps): ReactElement => {
  const classes = ['shadow-sm ring-1 ring-slate-200/70', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Card {...props} className={classes}>
      {children}
    </Card>
  );
};
