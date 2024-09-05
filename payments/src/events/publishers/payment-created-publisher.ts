import { PaymentCreatedEvent, Publisher, Subjects } from "@kh-micro-srv/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
