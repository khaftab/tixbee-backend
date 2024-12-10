import { Publisher, Subjects, TicketUnavailableEvent } from "@kh-micro-srv/common";

export class TicketUnavailablePublisher extends Publisher<TicketUnavailableEvent> {
  subject: Subjects.TicketUnavailable = Subjects.TicketUnavailable;
}
