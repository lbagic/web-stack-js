import { createLocaleMessages } from "@/internationalization/messages";

export const en = createLocaleMessages({
  roles: {
    Admin: "Admin",
    User: "User",
    Guest: "Guest",
  },
  HTMLInputErrors: {
    badInput: "Bad input value.",
    patternMismatch: "Value does not match.",
    rangeOverflow: "Maximum allowed value is {max}.",
    rangeUnderflow: "Minimum allowed value is {min}.",
    tooLong: "Maximum number of characters is {maxlength}.",
    tooShort: "Minimum number of characters is {minlength}.",
    stepMismatch: "Value step mismatch.",
    typeMismatch: "Value is not valid.",
    valueMissing: "This field is required.",
  },
  login: {
    action: "Log In",
    description: "Log in to Application.",
  },
});
