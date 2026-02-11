import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdCaptureItem } from "../constants";
import type { StationVisit } from "../types";

// ─── Helpers ───────────────────────────────────

function createEmptyVisit(): StationVisit {
  return {
    visitId: crypto.randomUUID(),
    adImages: [],
  };
}

// ─── Store Interface ───────────────────────────

interface CaptureState {
  /** 완료된 역사 방문 스택 */
  completedVisits: StationVisit[];
  /** 현재 촬영 중인 역사 */
  currentVisit: StationVisit;

  // ─── Current visit mutations ───

  setLocationImage: (dataUrl: string) => void;
  addAdImage: (item: AdCaptureItem) => void;
  setRecognizedAdvertiser: (
    adv: { id: string; name: string } | undefined
  ) => void;
  setSkipLocation: (skip: boolean) => void;
  setGps: (lat: number, lng: number, accuracy?: number) => void;

  // ─── Multi-station actions ───

  /** "다음 역 촬영" — 현재 데이터를 스택에 push, 새 세션 시작 */
  pushCurrentAndStartNew: () => void;

  /** 모든 방문 데이터를 반환 (completedVisits + currentVisit) */
  getAllVisits: () => StationVisit[];

  /** 완료 스택에서 특정 역사 삭제 */
  removeVisit: (visitId: string) => void;

  /** 특정 역사의 광고 사진 삭제 */
  removeAdImage: (visitId: string, imageIndex: number) => void;

  /** 전체 초기화 (보고서 전송 완료 후) */
  resetAll: () => void;

  // ─── Derived helpers (plain getters) ───

  /** 촬영된 총 역사 수 (스택 + 현재) */
  getTotalStationCount: () => number;
  /** 총 광고 사진 수 */
  getTotalAdImageCount: () => number;
}

// ─── Store Creation ────────────────────────────

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set, get) => ({
      completedVisits: [],
      currentVisit: createEmptyVisit(),

      // ── Current visit setters ──

      setLocationImage: (dataUrl) =>
        set((s) => ({
          currentVisit: {
            ...s.currentVisit,
            locationImage: dataUrl,
            locationCapturedAt: new Date().toISOString(),
          },
        })),

      addAdImage: (item) =>
        set((s) => ({
          currentVisit: {
            ...s.currentVisit,
            adImages: [...s.currentVisit.adImages, item],
          },
        })),

      setRecognizedAdvertiser: (adv) =>
        set((s) => ({
          currentVisit: { ...s.currentVisit, recognizedAdvertiser: adv },
        })),

      setSkipLocation: (skip) =>
        set((s) => ({
          currentVisit: { ...s.currentVisit, skipLocation: skip },
        })),

      setGps: (lat, lng, accuracy) =>
        set((s) => ({
          currentVisit: { ...s.currentVisit, lat, lng, accuracy },
        })),

      // ── Multi-station ──

      pushCurrentAndStartNew: () =>
        set((s) => ({
          completedVisits: [...s.completedVisits, s.currentVisit],
          currentVisit: createEmptyVisit(),
        })),

      getAllVisits: () => {
        const { completedVisits, currentVisit } = get();
        const hasData =
          currentVisit.adImages.length > 0 || !!currentVisit.locationImage;
        return hasData
          ? [...completedVisits, currentVisit]
          : [...completedVisits];
      },

      removeVisit: (visitId) =>
        set((s) => ({
          completedVisits: s.completedVisits.filter(
            (v) => v.visitId !== visitId
          ),
          // 현재 촬영 중인 것도 삭제 대상이면 초기화
          currentVisit:
            s.currentVisit.visitId === visitId
              ? createEmptyVisit()
              : s.currentVisit,
        })),

      removeAdImage: (visitId, imageIndex) =>
        set((s) => ({
          completedVisits: s.completedVisits.map((v) =>
            v.visitId === visitId
              ? {
                  ...v,
                  adImages: v.adImages.filter((_, i) => i !== imageIndex),
                }
              : v
          ),
          currentVisit:
            s.currentVisit.visitId === visitId
              ? {
                  ...s.currentVisit,
                  adImages: s.currentVisit.adImages.filter(
                    (_, i) => i !== imageIndex
                  ),
                }
              : s.currentVisit,
        })),

      resetAll: () =>
        set({ completedVisits: [], currentVisit: createEmptyVisit() }),

      // ── Getters ──

      getTotalStationCount: () => {
        const { completedVisits, currentVisit } = get();
        const currentHasData =
          currentVisit.adImages.length > 0 || !!currentVisit.locationImage;
        return completedVisits.length + (currentHasData ? 1 : 0);
      },

      getTotalAdImageCount: () => {
        const { completedVisits, currentVisit } = get();
        return (
          completedVisits.reduce((sum, v) => sum + v.adImages.length, 0) +
          currentVisit.adImages.length
        );
      },
    }),
    {
      name: "admate-capture-multi-station",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
