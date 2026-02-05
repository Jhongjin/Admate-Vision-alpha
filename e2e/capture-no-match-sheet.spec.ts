import { test, expect } from "@playwright/test";

/**
 * E2E: 광고주 매칭 실패 시트 시나리오
 * - 캡처 페이지에서 "위치 없음" → "광고 촬영" 시 OCR 결과가 등록 광고주와 매칭되지 않으면
 *   "매칭되는 광고주가 없습니다" 시트가 열리고, "재촬영 시도", "광고주 등록", "일단 저장" 버튼이 노출되는지 검증
 */
test.describe("Capture – 매칭 실패 시트", () => {
  test.beforeEach(async ({ page, context }) => {
    // 보호 라우트 접근을 위해 이메일 쿠키 설정 (E2E 테스트용)
    await context.addCookies([
      {
        name: "admate_user_email",
        value: "e2e@test.com",
        domain: "localhost",
        path: "/",
      },
    ]);

    // OCR API 모킹: 매칭되지 않는 텍스트 반환
    await page.route("**/api/capture/ocr", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ text: "UnknownBrandXYZ123", confidence: 0.5 }),
        });
      } else {
        await route.continue();
      }
    });

    // 카메라 권한 모킹 (getUserMedia 성공)
    await page.addInitScript(() => {
      const noop = () => {};
      const mockStream = {
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
        addTrack: noop,
        removeTrack: noop,
        getTrackById: () => null,
        clone: () => mockStream,
        active: false,
        id: "mock-id",
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => true,
      };
      Object.defineProperty(navigator, "mediaDevices", {
        value: {
          getUserMedia: () => Promise.resolve(mockStream as unknown as MediaStream),
          enumerateDevices: () => Promise.resolve([]),
        },
        configurable: true,
      });
    });
  });

  test("매칭 실패 시 시트가 열리고 재촬영/광고주 등록/일단 저장 버튼이 보인다", async ({
    page,
  }) => {
    await page.goto("/capture");

    // 카메라 준비 대기 후 "위치 없음" 버튼 표시 확인
    const locationNoneBtn = page.getByRole("button", { name: /위치 없음/i });
    await expect(locationNoneBtn).toBeVisible({ timeout: 15000 });

    await locationNoneBtn.click();

    // "광고 촬영" 버튼 클릭 (OCR 모킹으로 인해 매칭 실패 → 시트 열림)
    const adCaptureBtn = page.getByRole("button", {
      name: /광고 촬영 \(\d+\/\d+\)/i,
    });
    await expect(adCaptureBtn).toBeVisible({ timeout: 5000 });
    await adCaptureBtn.click();

    // 시트 제목 확인
    await expect(
      page.getByRole("heading", { name: /매칭되는 광고주가 없습니다/i })
    ).toBeVisible({ timeout: 10000 });

    // 시트 내 액션 버튼 확인
    await expect(
      page.getByRole("button", { name: /재촬영 시도/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /광고주 등록/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /일단 저장/i })
    ).toBeVisible();
  });

  test("일단 저장 클릭 시 시트가 닫히고 광고 촬영 수가 1 증가한다", async ({
    page,
  }) => {
    await page.goto("/capture");

    const locationNoneBtn = page.getByRole("button", { name: /위치 없음/i });
    await expect(locationNoneBtn).toBeVisible({ timeout: 15000 });
    await locationNoneBtn.click();

    const adCaptureBtn = page.getByRole("button", {
      name: /광고 촬영 \(\d+\/\d+\)/i,
    });
    await expect(adCaptureBtn).toBeVisible({ timeout: 5000 });
    await adCaptureBtn.click();

    await expect(
      page.getByRole("heading", { name: /매칭되는 광고주가 없습니다/i })
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /일단 저장/i }).click();

    // 시트가 사라지고, 광고 1장으로 "광고 촬영 (1/10)" 등으로 표시
    await expect(
      page.getByRole("heading", { name: /매칭되는 광고주가 없습니다/i })
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /광고 촬영 \(1\/10\)/i })
    ).toBeVisible();
  });
});
