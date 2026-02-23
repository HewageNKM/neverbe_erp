import { Timestamp } from "firebase/firestore";
export interface Category {
  id?: string;
  name: string;
  description?: string;
  status: boolean;
  isDeleted?: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}
