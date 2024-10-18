import { Publisher, Subjects, TicketCreatedEvent } from "@kh-micro-srv/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
}
