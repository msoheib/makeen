import { TextField, TextFieldProps } from '@mui/material';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<T extends FieldValues> extends Omit<TextFieldProps, 'name'> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  rules?: object;
}

/**
 * Form input component integrated with react-hook-form
 * Provides validation, error handling, and responsive sizing
 */
export default function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  rules,
  ...textFieldProps
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          label={label}
          error={!!error}
          helperText={error?.message}
          fullWidth
          variant="outlined"
          sx={{
            '& .MuiInputBase-root': {
              minHeight: { xs: '48px', sm: '56px' }, // Touch-friendly height
            },
            ...textFieldProps.sx,
          }}
        />
      )}
    />
  );
}
