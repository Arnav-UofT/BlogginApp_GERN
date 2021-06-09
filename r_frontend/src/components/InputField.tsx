import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
} from "@chakra-ui/react";
import { useField } from "formik";
import React from "react";

type InputFieldProps = {
  //React.InputHTMLAttributes<HTMLInputElement> & {
  //React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  name: string;
  label: string;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  textarea,
  ...props
}) => {
  // let ComponentName = Input;
  // if component is text area
  // if (textarea) {
  //   ComponentName = Textarea;
  // }

  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      {textarea ? (
        <Textarea label={label} {...props} {...field} id={field.name} />
      ) : (
        <Input label={label} {...props} {...field} id={field.name} />
      )}
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
