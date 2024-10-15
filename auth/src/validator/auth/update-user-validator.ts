import { body } from "express-validator";

export default [
  body("name").isString().withMessage("Name must be a string"),
  body("address").isString().withMessage("Address must be a string"),
  body("postalCode").isString().withMessage("Postal code must be a number"),
  body("city").isString().withMessage("City must be a string"),
  body("state").isString().withMessage("State must be a string"),
  body("country").isString().withMessage("Country must be a string"),
  body()
    .custom((body) => {
      const fields = ["name", "address", "postalCode", "city", "state", "country"];
      const bodyFields = Object.keys(body);
      return bodyFields.every((field) => fields.includes(field));
    })
    .withMessage("Invalid field provided"),
];
