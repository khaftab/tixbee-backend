import { body } from "express-validator";

const orderValidator = [
  body("ticketId")
    .not() // menas title should be provided
    // .withMessage("TicketId must be there")
    // .bail()
    .isEmpty() // means title should not be empty
    .withMessage("Title cannot be empty")
    .bail()
    .isMongoId() // we are making sure that ticketId is mongoId. But this add a slight bit of dependent on the ticket service. So, we can remove this check to suit it to be more microservice.
    .withMessage("TicketId must be a valid id"),
];

export default orderValidator;
