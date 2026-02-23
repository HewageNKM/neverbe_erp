export interface Email {
  to: string;
  subject: string;
  body: string;
  [key: string]: any;
}
