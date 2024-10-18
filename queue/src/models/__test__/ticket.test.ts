import { Ticket } from "../Ticket";

// In simple terms, optimistic concurrency control is a strategy to ensure that the data is not changed by multiple users at the same time. It is a way to prevent the lost update problem. In MongoDB, it is implemented using the versioning mechanism. In Mongoose, we can enable optimistic concurrency control by setting the optimisticConcurrency option to true in the schema.

it("implements optimistic concurrency control", async () => {
  // Create an instance of a ticket
  const ticket = new Ticket({
    title: "concert",
    price: 5,
    userId: "123",
    category: "concert",
    description: "describe",
    imagePublicId: "123",
  });

  // Save the ticket to the database
  await ticket.save();

  // Fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // Make two separate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  // Save the first fetched ticket
  await firstInstance!.save();

  // Save the second fetched ticket and expect an error
  try {
    await secondInstance!.save();
  } catch (err) {
    // If we get the error, then the test is successful means the versioning is working.
    // VersionError: No matching document found for id "66d1d2cad6d96e237d2c9a86" version 0 modifiedPaths "price"
    return;
  }

  throw new Error("Should not reach this point");
});

it("increments the version number on multiple saves", async () => {
  // if ticket is saved without any changes, this does not increment the version number.
  const ticket = new Ticket({
    title: "Hello world",
    price: 20,
    userId: "123",
    category: "concert",
    description: "describe",
    imagePublicId: "123",
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);

  ticket.set({ price: 10 });
  await ticket.save();
  expect(ticket.version).toEqual(1);

  ticket.set({ category: "other" });
  await ticket.save();
  expect(ticket.version).toEqual(2);
});
