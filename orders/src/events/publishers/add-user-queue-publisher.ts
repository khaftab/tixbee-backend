import { Publisher, Subjects, AddUserToQueue } from "@kh-micro-srv/common";

export class AddUserToQueuePublisher extends Publisher<AddUserToQueue> {
  subject: Subjects.AddUser = Subjects.AddUser;
}
