'use client';

import { Label } from '@/components/ui/label';
import { useFormContext, FieldValues, Path } from 'react-hook-form';
import { FormError } from './FormError';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  children: React.ReactNode;
  description?: string;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  children,
  description,
}: FormFieldProps<T>) {
  const {
    formState: { errors },
  } = useFormContext<T>();

  const error = errors?.[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {children}
      {error && <FormError message={error} />}
    </div>
  );
}
