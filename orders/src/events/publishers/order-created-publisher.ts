import { Publisher, Subjects, OrderCreatedEvent } from "@kh-micro-srv/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
