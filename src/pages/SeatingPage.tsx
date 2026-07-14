import { useMemo, useState, useCallback } from "react";
import { useMembers, useSeatingPositions, saveSeatingPosition } from "../hooks";
import { getInitialPosition, getUniqueInstrumentColors } from "../utils";
import SeatingCard from "../components/SeatingCard";

const BOARD_WIDTH = 1200;
const BOARD_HEIGHT = 760;

interface CardState {
  x: number;
  y: number;
  rotation: number;
}

export default function SeatingPage() {
  const { members, loading: memLoading } = useMembers();
  const { positions, loading: posLoading } = useSeatingPositions();

  // 로컬 상태: 사용자가 드래그하는 동안 즉각 반응하도록
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, CardState>
  >({});

  const positionMap = useMemo(() => {
    const map: Record<string, CardState> = {};
    positions.forEach((p) => {
      map[p.memberId] = {
        x: p.x,
        y: p.y,
        rotation: p.rotation,
      };
    });
    return map;
  }, [positions]);

  const cardStates = useMemo<Record<string, CardState>>(() => {
    const states: Record<string, CardState> = {};
    members.forEach((m, index) => {
      if (localOverrides[m.id]) {
        states[m.id] = localOverrides[m.id];
      } else if (positionMap[m.id]) {
        states[m.id] = positionMap[m.id];
      } else {
        const init = getInitialPosition(index);
        states[m.id] = { x: init.x, y: init.y, rotation: 0 };
      }
    });
    return states;
  }, [members, positionMap, localOverrides]);

  const legendColors = useMemo(
    () => getUniqueInstrumentColors(members.map((m) => m.instrumentName)),
    [members],
  );

  const handleMove = useCallback((memberId: string, x: number, y: number) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] ?? { rotation: 0 }),
        x,
        y,
      },
    }));
  }, []);

  const handleRotate = useCallback(
    (memberId: string, rotation: number) => {
      setLocalOverrides((prev) => {
        const existing = prev[memberId] ?? positionMap[memberId] ?? { x: 0, y: 0 };
        return {
          ...prev,
          [memberId]: { ...existing, rotation },
        };
      });
    },
    [positionMap],
  );

  const handleDragEnd = useCallback(
    async (memberId: string) => {
      const state = localOverrides[memberId];
      if (!state) return;
      try {
        await saveSeatingPosition(
          memberId,
          state.x,
          state.y,
          state.rotation,
        );
      } catch (err) {
        console.error("save seating position error", err);
      }
    },
    [localOverrides],
  );

  if (memLoading || posLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-stone-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          자리배치
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          단원 조각을 드래그로 이동하고, 오른쪽 위 핸들을 드래그해 회전하세요.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-stone-500">등록된 단원이 없습니다.</p>
          <p className="mt-1 text-sm text-stone-400">
            연명부에서 단원을 먼저 추가하세요.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <div
              className="relative bg-stone-100/60 bg-[radial-gradient(circle,_#e7e5e4_1px,_transparent_1px)] [background-size:20px_20px]"
              style={{
                width: BOARD_WIDTH,
                height: BOARD_HEIGHT,
              }}
            >
              {members.map((m) => {
                const state = cardStates[m.id];
                if (!state) return null;
                return (
                  <SeatingCard
                    key={m.id}
                    member={m}
                    x={state.x}
                    y={state.y}
                    rotation={state.rotation}
                    onMove={handleMove}
                    onRotate={handleRotate}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="mb-3 text-sm font-bold text-stone-700">
              악기별 색상 범례
            </h3>
            {legendColors.length === 0 ? (
              <p className="text-sm text-stone-400">표시할 악기가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {legendColors.map(({ name, color }) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 text-sm text-stone-600"
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-sm border border-stone-300"
                      style={{ backgroundColor: color }}
                    />
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
