import type { ReactNode } from 'react';

export function Page({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`w-full pb-16 ${className}`} style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '32px' }}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-base font-semibold text-fg-strong">{title}</p>
        {description && <p className="mt-1.5 max-w-xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Surface({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
}) {
  return <As className={className}>{children}</As>;
}

