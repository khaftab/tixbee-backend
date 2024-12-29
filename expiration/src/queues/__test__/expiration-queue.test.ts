import { Queue } from "bullmq";

jest.mock("bullmq", () => ({
  Queue: jest.fn(),
  Worker: jest.fn(() => ({
    on: jest.fn(),
  })),
}));

it("should initialize the expirationQueue with the correct options", () => {
  require("../expiration-queue");

  expect(Queue).toHaveBeenCalledWith("order-expiration", {
    connection: {
      host: "localhost",
      port: 6379,
    },
  });
});
