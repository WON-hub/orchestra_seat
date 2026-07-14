import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  useCategories,
  useInstruments,
  useMembers,
  addCategory,
  addInstrument,
  deleteInstrument,
  addMember,
  updateMember,
  deleteMember,
} from "../hooks";
import {
  CATEGORY_OPTIONS,
  CATEGORY_ORDER,
  type CategoryName,
  type RosterInstrument,
  type RosterMember,
} from "../types";
import { getInstrumentColor } from "../utils";

export default function RosterPage() {
  const { categories, loading: catLoading } = useCategories();
  const { instruments, loading: insLoading } = useInstruments();
  const { members, loading: memLoading } = useMembers();

  const [showCatModal, setShowCatModal] = useState(false);
  const [showInsModal, setShowInsModal] = useState(false);
  const [insModalCategory, setInsModalCategory] = useState<string>("");
  const [showMemModal, setShowMemModal] = useState(false);
  const [memModalInstrument, setMemModalInstrument] =
    useState<RosterInstrument | null>(null);
  const [editingMember, setEditingMember] = useState<RosterMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = catLoading || insLoading || memLoading;

  const existingCategoryNames = useMemo(
    () => new Set(categories.map((c) => c.name)),
    [categories],
  );

  const availableCategoryOptions = CATEGORY_OPTIONS.filter(
    (c) => !existingCategoryNames.has(c),
  );

  // 분류 -> 악기 -> 파트 -> 단원 그룹화
  const grouped = useMemo(() => {
    const sortedCats = [...categories].sort(
      (a, b) => a.order - b.order,
    );
    return sortedCats.map((cat) => {
      const catInstruments = instruments
        .filter((ins) => ins.category === cat.name)
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));
      const instrumentsWithParts = catInstruments.map((ins) => {
        const insMembers = members.filter(
          (m) => m.instrumentId === ins.id,
        );
        const parts = insMembers.reduce<Record<string, RosterMember[]>>(
          (acc, m) => {
            const p = m.part || "";
            if (!acc[p]) acc[p] = [];
            acc[p].push(m);
            return acc;
          },
          {},
        );
        const partGroups = Object.entries(parts)
          .map(([part, mems]) => ({
            part,
            members: [...mems].sort(
              (a, b) =>
                (a.createdAt?.toMillis?.() ?? 0) -
                (b.createdAt?.toMillis?.() ?? 0),
            ),
          }))
          .sort((a, b) => a.part.localeCompare(b.part, "ko"));
        return { instrument: ins, partGroups, memberCount: insMembers.length };
      });
      return { category: cat, instruments: instrumentsWithParts };
    });
  }, [categories, instruments, members]);

  async function handleAddCategory(name: CategoryName) {
    setError(null);
    try {
      await addCategory(name);
      setShowCatModal(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleAddInstrument(category: string, name: string) {
    setError(null);
    try {
      await addInstrument(category, name);
      setShowInsModal(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteInstrument(instrumentId: string, name: string) {
    setError(null);
    if (!confirm(`"${name}" 악기를 삭제하시겠습니까?`)) return;
    try {
      await deleteInstrument(instrumentId);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteMember(member: RosterMember) {
    setError(null);
    if (
      !confirm(
        `"${member.name}" 단원을 삭제하시겠습니까?\n연명부와 자리배치 정보가 함께 삭제됩니다.`,
      )
    )
      return;
    try {
      await deleteMember(member.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openAddMember(instrument: RosterInstrument) {
    setEditingMember(null);
    setMemModalInstrument(instrument);
    setShowMemModal(true);
  }

  function openEditMember(member: RosterMember) {
    const ins = instruments.find((i) => i.id === member.instrumentId) ?? null;
    setEditingMember(member);
    setMemModalInstrument(ins);
    setShowMemModal(true);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-stone-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            연명부 관리
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            분류 · 악기 · 파트 · 단원 계층 구조로 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowCatModal(true)}
          disabled={availableCategoryOptions.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} /> 분류 추가
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-stone-500">아직 분류가 없습니다.</p>
          <p className="mt-1 text-sm text-stone-400">
            상단의 "분류 추가" 버튼으로 시작하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ category, instruments: catInstruments }) => (
            <div
              key={category.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-400">
                    {CATEGORY_ORDER[category.name]}
                  </span>
                  <h3 className="text-base font-bold">{category.name}</h3>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
                    {catInstruments.length} 악기
                  </span>
                </div>
                <button
                  onClick={() => {
                    setInsModalCategory(category.name);
                    setShowInsModal(true);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200"
                >
                  <Plus size={14} /> 악기 추가
                </button>
              </div>

              {catInstruments.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-stone-400 sm:px-5">
                  분류 내 악기가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {catInstruments.map(
                    ({ instrument, partGroups, memberCount }) => (
                      <div
                        key={instrument.id}
                        className="px-4 py-4 sm:px-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-sm"
                              style={{
                                backgroundColor:
                                  getInstrumentColor(instrument.name),
                              }}
                            />
                            <span className="font-semibold">
                              {instrument.name}
                            </span>
                            <span className="text-xs text-stone-400">
                              {memberCount}명
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openAddMember(instrument)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
                            >
                              <Plus size={13} /> 단원
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteInstrument(
                                  instrument.id,
                                  instrument.name,
                                )
                              }
                              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="악기 삭제"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {partGroups.length === 0 ? (
                          <p className="mt-2 pl-5 text-sm text-stone-400">
                            단원이 없습니다.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-3 pl-1">
                            {partGroups.map(({ part, members: partMembers }) => (
                              <div key={part || "__empty__"}>
                                <div className="flex items-center gap-1 text-sm font-medium text-stone-500">
                                  <ChevronRight size={14} />
                                  {part || "파트 없음"}
                                </div>
                                <div className="mt-1 grid gap-2 pl-5 sm:grid-cols-2 lg:grid-cols-3">
                                  {partMembers.map((m) => (
                                    <div
                                      key={m.id}
                                      className="group flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                                            style={{
                                              backgroundColor:
                                                getInstrumentColor(
                                                  m.instrumentName,
                                                ),
                                            }}
                                          />
                                          <span className="truncate font-medium">
                                            {m.name}
                                          </span>
                                        </div>
                                        {m.note && (
                                          <p className="mt-0.5 truncate pl-4 text-xs text-stone-500">
                                            {m.note}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                          onClick={() => openEditMember(m)}
                                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                          title="수정"
                                        >
                                          <Pencil size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteMember(m)
                                          }
                                          className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                                          title="삭제"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCatModal && (
        <CategoryModal
          options={availableCategoryOptions}
          onClose={() => setShowCatModal(false)}
          onAdd={handleAddCategory}
        />
      )}
      {showInsModal && (
        <InstrumentModal
          category={insModalCategory}
          onClose={() => setShowInsModal(false)}
          onAdd={handleAddInstrument}
        />
      )}
      {showMemModal && memModalInstrument && (
        <MemberModal
          instrument={memModalInstrument}
          editing={editingMember}
          onClose={() => {
            setShowMemModal(false);
            setEditingMember(null);
          }}
          onSave={async (data) => {
            setError(null);
            try {
              if (editingMember) {
                await updateMember(editingMember.id, data);
              } else {
                await addMember(data);
              }
              setShowMemModal(false);
              setEditingMember(null);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Modals ------------------------------ */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CategoryModal({
  options,
  onClose,
  onAdd,
}: {
  options: CategoryName[];
  onClose: () => void;
  onAdd: (name: CategoryName) => void;
}) {
  return (
    <ModalShell title="분류 추가" onClose={onClose}>
      {options.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">
          추가 가능한 분류가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {options.map((name) => (
            <button
              key={name}
              onClick={() => onAdd(name)}
              className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3 text-left font-medium transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              <span>{name}</span>
              <span className="text-xs text-stone-400">
                order {CATEGORY_ORDER[name]}
              </span>
            </button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function InstrumentModal({
  category,
  onClose,
  onAdd,
}: {
  category: string;
  onClose: () => void;
  onAdd: (category: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <ModalShell title={`악기 추가 · ${category}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(category, name);
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">
            악기 이름
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 바이올린"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-stone-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          추가
        </button>
      </form>
    </ModalShell>
  );
}

function MemberModal({
  instrument,
  editing,
  onClose,
  onSave,
}: {
  instrument: RosterInstrument | null;
  editing: RosterMember | null;
  onClose: () => void;
  onSave: (data: {
    category: string;
    instrumentId: string;
    instrumentName: string;
    part: string;
    name: string;
    note: string;
  }) => void;
}) {
  const [part, setPart] = useState(editing?.part ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [note, setNote] = useState(editing?.note ?? "");

  const category = editing?.category ?? instrument?.category ?? "";
  const instrumentId = editing?.instrumentId ?? instrument?.id ?? "";
  const instrumentName =
    editing?.instrumentName ?? instrument?.name ?? "";

  return (
    <ModalShell
      title={editing ? "단원 수정" : "단원 추가"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            category,
            instrumentId,
            instrumentName,
            part,
            name,
            note,
          });
        }}
        className="space-y-4"
      >
        <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
          분류: {category} · 악기: {instrumentName}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">
            이름
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="단원 이름"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">
            파트
          </label>
          <input
            value={part}
            onChange={(e) => setPart(e.target.value)}
            placeholder="예: 1st"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-600">
            비고
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 악장"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-stone-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          {editing ? "수정" : "추가"}
        </button>
      </form>
    </ModalShell>
  );
}
