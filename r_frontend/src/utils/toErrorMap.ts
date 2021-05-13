import { UserError } from "../generated/graphql";

export const toErrorMap = (errors: UserError[]) => {
  const errorMap: Record<string, string> = {};
  errors.forEach(({ field, message }) => {
    errorMap[field] = message;
  });
  return errorMap;
};
