import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  RosterCategory,
  RosterInstrument,
  RosterMember,
  SeatingPosition,
  CategoryName,
} from "./types";
import { CATEGORY_ORDER } from "./types";

/* ----------------------------- Categories ----------------------------- */

export function useCategories() {
  const [categories, setCategories] = useState<RosterCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "roster_categories"),
      orderBy("order", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: RosterCategory[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RosterCategory, "id">),
        }));
        list.sort((a, b) => a.order - b.order);
        setCategories(list);
        setLoading(false);
      },
      (err) => {
        console.error("categories load error", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { categories, loading };
}

export async function addCategory(name: CategoryName) {
  const existing = await getDocs(collection(db, "roster_categories"));
  const dup = existing.docs.find((d) => (d.data() as RosterCategory).name === name);
  if (dup) throw new Error("이미 존재하는 분류입니다.");
  await addDoc(collection(db, "roster_categories"), {
    name,
    order: CATEGORY_ORDER[name],
    createdAt: serverTimestamp(),
  });
}

/* ----------------------------- Instruments ----------------------------- */

export function useInstruments() {
  const [instruments, setInstruments] = useState<RosterInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "roster_instruments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: RosterInstrument[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RosterInstrument, "id">),
        }));
        list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        setInstruments(list);
        setLoading(false);
      },
      (err) => {
        console.error("instruments load error", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { instruments, loading };
}

export async function addInstrument(category: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("악기 이름을 입력하세요.");
  const existing = await getDocs(collection(db, "roster_instruments"));
  const dup = existing.docs.find(
    (d) =>
      (d.data() as RosterInstrument).category === category &&
      (d.data() as RosterInstrument).name === trimmed,
  );
  if (dup) throw new Error("같은 분류 내 동일한 악기 이름이 이미 존재합니다.");
  await addDoc(collection(db, "roster_instruments"), {
    category,
    name: trimmed,
    createdAt: serverTimestamp(),
  });
}

export async function deleteInstrument(instrumentId: string) {
  const membersSnap = await getDocs(collection(db, "roster_members"));
  const hasMember = membersSnap.docs.some(
    (d) => (d.data() as RosterMember).instrumentId === instrumentId,
  );
  if (hasMember) throw new Error("해당 악기에 단원이 있어 삭제할 수 없습니다.");
  await deleteDoc(doc(db, "roster_instruments", instrumentId));
}

/* ------------------------------- Members ------------------------------- */

export function useMembers() {
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "roster_members"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: RosterMember[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RosterMember, "id">),
        }));
        setMembers(list);
        setLoading(false);
      },
      (err) => {
        console.error("members load error", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { members, loading };
}

export async function addMember(input: {
  category: string;
  instrumentId: string;
  instrumentName: string;
  part: string;
  name: string;
  note: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("단원 이름을 입력하세요.");
  await addDoc(collection(db, "roster_members"), {
    category: input.category,
    instrumentId: input.instrumentId,
    instrumentName: input.instrumentName,
    part: input.part.trim(),
    name,
    note: input.note.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMember(
  id: string,
  input: {
    category: string;
    instrumentId: string;
    instrumentName: string;
    part: string;
    name: string;
    note: string;
  },
) {
  const name = input.name.trim();
  if (!name) throw new Error("단원 이름을 입력하세요.");
  await updateDoc(doc(db, "roster_members", id), {
    category: input.category,
    instrumentId: input.instrumentId,
    instrumentName: input.instrumentName,
    part: input.part.trim(),
    name,
    note: input.note.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMember(memberId: string) {
  await deleteDoc(doc(db, "roster_members", memberId));
  // 같은 문서 ID를 가진 seating_positions 문서도 함께 삭제
  try {
    await deleteDoc(doc(db, "seating_positions", memberId));
  } catch (err) {
    console.error("seating position delete error", err);
  }
}

/* --------------------------- Seating positions --------------------------- */

export function useSeatingPositions() {
  const [positions, setPositions] = useState<SeatingPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "seating_positions"),
      (snap) => {
        const list: SeatingPosition[] = snap.docs.map(
          (d) => d.data() as SeatingPosition,
        );
        setPositions(list);
        setLoading(false);
      },
      (err) => {
        console.error("seating positions load error", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { positions, loading };
}

export async function saveSeatingPosition(
  memberId: string,
  x: number,
  y: number,
  rotation: number,
) {
  await setDoc(
    doc(db, "seating_positions", memberId),
    {
      memberId,
      x,
      y,
      rotation,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
