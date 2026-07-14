import { useRef, useCallback } from "react";
import { RotateCw } from "lucide-react";
import type { RosterMember } from "../types";
import { getInstrumentColor } from "../utils";

export const CARD_WIDTH = 70;
export const CARD_MIN_HEIGHT = 35;
const BOARD_WIDTH = 1200;
const BOARD_HEIGHT = 760;

interface Props {
  member: RosterMember;
  x: number;
  y: number;
  rotation: number;
  onMove: (memberId: string, x: number, y: number) => void;
  onRotate: (memberId: string, rotation: number) => void;
  onDragEnd: (memberId: string) => void;
}

export default function SeatingCard({
  member,
  x,
  y,
  rotation,
  onMove,
  onRotate,
  onDragEnd,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      // 회전 핸들에서 시작된 이벤트는 무시
      if ((e.target as HTMLElement).dataset.rotateHandle) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const startX = e.clientX;
      const startY = e.clientY;
      const originX = x;
      const originY = y;
      let moved = false;

      const onMoveEvent = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
        let nextX = originX + dx;
        let nextY = originY + dy;
        // 배치판 바깥으로 나가지 않도록 제한
        nextX = Math.max(0, Math.min(BOARD_WIDTH - CARD_WIDTH, nextX));
        nextY = Math.max(0, Math.min(BOARD_HEIGHT - CARD_MIN_HEIGHT, nextY));
        onMove(member.id, nextX, nextY);
      };

      const onUpEvent = (ev: PointerEvent) => {
        (e.currentTarget as HTMLElement).releasePointerCapture(
          ev.pointerId,
        );
        window.removeEventListener("pointermove", onMoveEvent);
        window.removeEventListener("pointerup", onUpEvent);
        if (moved) onDragEnd(member.id);
      };

      window.addEventListener("pointermove", onMoveEvent);
      window.addEventListener("pointerup", onUpEvent);
    },
    [x, y, member.id, onMove, onDragEnd],
  );

  const handleRotateStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const onMoveEvent = (ev: PointerEvent) => {
        const angleRad = Math.atan2(
          ev.clientY - centerY,
          ev.clientX - centerX,
        );
        const angleDeg = angleRad * (180 / Math.PI);
        onRotate(member.id, Math.round(angleDeg));
      };

      const onUpEvent = (ev: PointerEvent) => {
        (e.currentTarget as HTMLElement).releasePointerCapture(
          ev.pointerId,
        );
        window.removeEventListener("pointermove", onMoveEvent);
        window.removeEventListener("pointerup", onUpEvent);
        onDragEnd(member.id);
      };

      window.addEventListener("pointermove", onMoveEvent);
      window.addEventListener("pointerup", onUpEvent);
    },
    [member.id, onRotate, onDragEnd],
  );

  return (
    <div
      ref={cardRef}
      data-card
      onPointerDown={handleDragStart}
      className="absolute cursor-grab touch-none select-none rounded-lg border border-stone-300/70 shadow-md transition-shadow active:cursor-grabbing active:shadow-lg"
      style={{
        left: x,
        top: y,
        width: CARD_WIDTH,
        minHeight: CARD_MIN_HEIGHT,
        transform: `rotate(${rotation}deg)`,
        backgroundColor: getInstrumentColor(member.instrumentName),
        touchAction: "none",
      }}
    >
      <div className="px-1.5 py-1 text-center leading-tight">
        <p className="truncate text-[10px] font-medium text-stone-700/80">
          {member.instrumentName}
        </p>
        <p className="truncate text-xs font-bold text-stone-800">
          {member.name}
        </p>
        <p className="truncate text-[10px] text-stone-700/80">
          {member.part}
        </p>
      </div>
      <button
        data-rotate-handle="true"
        onPointerDown={handleRotateStart}
        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-100 active:bg-stone-200"
        title="회전"
        style={{ touchAction: "none" }}
      >
        <RotateCw size={11} />
      </button>
    </div>
  );
}
