import { Publisher, Subjects, OrderCancelledEvent } from "@kh-micro-srv/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
