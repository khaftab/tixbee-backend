import { Publisher, Subjects, TicketCreatedEvent, TicketUpdatedEvent } from "@kh-micro-srv/common";

export class TicketUpdatePublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
