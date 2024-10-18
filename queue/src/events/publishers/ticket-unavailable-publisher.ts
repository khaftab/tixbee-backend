import { Publisher, Subjects } from "@kh-micro-srv/common";

interface TicketUnavailableEvent {
  subject: "ticket:unavailable";
  data: {
    ticketId: string;
  };
}

export class TicketUnavailablePublisher extends Publisher<TicketUnavailableEvent> {
  // @ts-ignore
  subject = "ticket:unavailable";
}
