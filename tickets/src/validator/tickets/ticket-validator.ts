import { body } from "express-validator";
import { ticketCategory } from "../../models/Ticket";

const ticketValidator = [
  body("title")
    .not() // menas title should be provided
    .isEmpty() // means title should not be empty
    .bail()
    .withMessage("Title cannot be empty"),
  body("price")
    .not()
    .isEmpty()
    .bail()
    .withMessage("Price cannot be empty")
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0"),
  body("category")
    .not()
    .isEmpty()
    .bail()
    .withMessage("Category cannot be empty")
    .custom((category) => {
      return Object.keys(ticketCategory).includes(category);
    })
    .withMessage("Invalid category provided"),
  body("imagePublicId").not().isEmpty().bail().withMessage("Image cannot be empty"),
  body("description").not().isEmpty().bail().withMessage("Description cannot be empty"), // description length is checked in client side (since it contains html tags we need to count the characters without html tags)
  // throw error if other fields are provided
  body()
    .custom((body) => {
      const fields = ["title", "price", "category", "imagePublicId", "description"];
      const bodyFields = Object.keys(body);
      return bodyFields.every((field) => fields.includes(field));
    })
    .withMessage("Invalid field provided"),
];

export default ticketValidator;
