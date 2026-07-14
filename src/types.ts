import type { Timestamp } from "firebase/firestore";

export type CategoryName = "현악기" | "목관" | "금관" | "타악기" | "기타";

export interface RosterCategory {
  id: string;
  name: CategoryName;
  order: number;
  createdAt?: Timestamp;
}

export interface RosterInstrument {
  id: string;
  category: string;
  name: string;
  createdAt?: Timestamp;
}

export interface RosterMember {
  id: string;
  category: string;
  instrumentId: string;
  instrumentName: string;
  part: string;
  name: string;
  note: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SeatingPosition {
  memberId: string;
  x: number;
  y: number;
  rotation: number;
  updatedAt?: Timestamp;
}

export const CATEGORY_OPTIONS: CategoryName[] = [
  "현악기",
  "목관",
  "금관",
  "타악기",
  "기타",
];

export const CATEGORY_ORDER: Record<CategoryName, number> = {
  현악기: 0,
  목관: 1,
  금관: 2,
  타악기: 3,
  기타: 4,
};
