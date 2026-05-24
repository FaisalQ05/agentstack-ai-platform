'use client';

import { FormProvider, UseFormReturn, FieldValues } from 'react-hook-form';
import clsx from 'clsx';

interface AppFormProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  children: React.ReactNode;
  className?: string;
}

export function AppForm<T extends FieldValues>({
  methods,
  onSubmit,
  children,
  className,
}: AppFormProps<T>) {
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={clsx('space-y-6 w-full', className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
