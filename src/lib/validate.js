import { validationResult } from "express-validator";

// runs the validation chain
export const runValidation = async (req, validations) => {
  for (let validation of validations) {
    await validation.run(req);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw { status: 400, errors: errors.array() };
  }
};
