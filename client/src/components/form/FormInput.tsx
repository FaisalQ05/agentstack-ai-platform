'use client';

import { Input } from '@/components/ui/input';
import { useFormContext, FieldValues, Path } from 'react-hook-form';
import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

interface FormInputProps<
  T extends FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>;
  left?: ReactNode; // optional left icon/element
  right?: ReactNode; // optional right icon/element
  inputSize?: 'sm' | 'md' | 'lg'; // new size prop
}

export function FormInput<T extends FieldValues>({
  name,
  className,
  type = 'text',
  left,
  right,
  inputSize = 'md',
  ...props
}: FormInputProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();

  const error = errors?.[name]?.message as string | undefined;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const sizeClass = {
    sm: 'h-8 text-sm px-2 py-1',
    md: 'h-10 text-base px-3 py-2',
    lg: 'h-12 text-lg px-4 py-3',
  }[inputSize];

  return (
    <div className="relative w-full">
      {/* Left slot */}
      {left && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {left}
        </div>
      )}

      <Input
        {...register(name)}
        {...props}
        type={inputType}
        className={clsx(
          className,
          sizeClass,
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive'
            : '',
          left && 'pl-10',
          (isPassword || right) && 'pr-12',
          'transition-all duration-150' // smooth transitions
        )}
      />

      {/* Right slot */}
      {isPassword ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 rounded"
        >
          {showPassword ? 'Hide' : 'Show'}
        </Button>
      ) : (
        right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {right}
          </div>
        )
      )}
    </div>
  );
}
