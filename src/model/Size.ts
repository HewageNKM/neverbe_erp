import { Timestamp } from "firebase/firestore";
export interface Size {
  id?: string;
  name: string;
  status: boolean;
  isDeleted?: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}
