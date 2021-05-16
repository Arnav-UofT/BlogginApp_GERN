import { UserPassInput } from "src/resolvers/UserPassInput";

export const validateRegister = (options: UserPassInput) => {
  if (options.username.length < 3) {
    return [
      {
        field: "username",
        message: "Username needs at least 3 chars",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "Username cannot contain special chars",
      },
    ];
  }

  if (options.password.length < 3) {
    return [
      {
        field: "password",
        message: "Password needs at least 3 chars",
      },
    ];
  }

  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invalid Email",
      },
    ];
  }

  return null;
};
