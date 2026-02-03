import { describe, it, expect } from "vitest";
import { matchOcrToAdvertiser } from "./match-advertiser";
import { DUMMY_ADVERTISERS } from "@/features/capture/data/dummy-advertisers";

describe("matchOcrToAdvertiser", () => {
  it("returns null for empty OCR text", () => {
    expect(matchOcrToAdvertiser("", DUMMY_ADVERTISERS)).toBeNull();
    expect(matchOcrToAdvertiser("   \n  ", DUMMY_ADVERTISERS)).toBeNull();
  });

  it("matches SSG when OCR contains SSG or SSG.COM", () => {
    const ssg = matchOcrToAdvertiser("SSG.COM 신선은 이마트로부터!", DUMMY_ADVERTISERS);
    expect(ssg).not.toBeNull();
    expect(ssg?.advertiserName).toBe("에스에스지닷컴");

    const ssg2 = matchOcrToAdvertiser("SSG", DUMMY_ADVERTISERS);
    expect(ssg2).not.toBeNull();
    expect(ssg2?.advertiserName).toBe("에스에스지닷컴");
  });

  it("matches when OCR has spaces (vip 자산운용 vs vip자산운용)", () => {
    const vip = matchOcrToAdvertiser("vip자산운용 그래서 우리가 공부한다", DUMMY_ADVERTISERS);
    expect(vip).not.toBeNull();
    expect(vip?.advertiserName).toBe("브이아이피자산");

    const vip2 = matchOcrToAdvertiser("vip 자산운용 직장생활", DUMMY_ADVERTISERS);
    expect(vip2).not.toBeNull();
    expect(vip2?.advertiserName).toBe("브이아이피자산");
  });

  it("matches aT / at for 한국농수산식품유통공사", () => {
    const at = matchOcrToAdvertiser("aT 한국농수산식품유통공사 FSQUARE", DUMMY_ADVERTISERS);
    expect(at).not.toBeNull();
    expect(at?.advertiserName).toBe("한국농수산식품유통공사");

    const at2 = matchOcrToAdvertiser("at 농수산", DUMMY_ADVERTISERS);
    expect(at2).not.toBeNull();
    expect(at2?.advertiserName).toBe("한국농수산식품유통공사");
  });

  it("matches LG when OCR contains LG or DIOS", () => {
    const lg = matchOcrToAdvertiser("LG DIOS 식기세척기", DUMMY_ADVERTISERS);
    expect(lg).not.toBeNull();
    expect(lg?.advertiserName).toBe("LG전자");
  });

  it("matches 충남혁신도시 when OCR contains 혁신도시", () => {
    const chungnam = matchOcrToAdvertiser("충남혁신도시 환황해권 중심도시", DUMMY_ADVERTISERS);
    expect(chungnam).not.toBeNull();
    expect(chungnam?.advertiserName).toBe("충남혁신도시");
  });

  it("matches 서울특별시교육청 when OCR contains 교육청 or 보건안전진흥원", () => {
    const sen = matchOcrToAdvertiser("서울특별시교육청보건안전진흥원 건강한 서울 학교", DUMMY_ADVERTISERS);
    expect(sen).not.toBeNull();
    expect(sen?.advertiserName).toBe("서울특별시교육청");
  });

  it("matches 카카오뱅크 when OCR contains 카카오뱅크", () => {
    const kb = matchOcrToAdvertiser("경기도 소상공인 카카오뱅크 X 경기신용보증재단", DUMMY_ADVERTISERS);
    expect(kb).not.toBeNull();
    expect(kb?.advertiserName).toBe("카카오뱅크");
  });
});
