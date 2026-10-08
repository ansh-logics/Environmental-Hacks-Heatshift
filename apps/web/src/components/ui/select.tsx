import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type SelectOption = { value: string; label: string };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly SelectOption[];
};

export function Select({ options, className, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        'field-input appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233a2c26' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
