import { Transform } from 'class-transformer';

export function LowercaseEmail(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  );
}
