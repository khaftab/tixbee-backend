import { body } from "express-validator";

const ticketValidator = [
  body("title")
    .not() // menas title should be provided
    .isEmpty() // means title should not be empty
    .withMessage("Title cannot be empty"),
  body("price")
    .not()
    .isEmpty()
    .withMessage("Price cannot be empty")
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0"),
  // throw error if other fields are provided
  body()
    .custom((body) => {
      const fields = ["title", "price"];
      const bodyFields = Object.keys(body);
      return bodyFields.every((field) => fields.includes(field));
    })
    .withMessage("Invalid field provided"),
];

export default ticketValidator;
