/**
 * 테스트용 더미 광고주 목록.
 * 실제 광고주 등록 페이지 연동 전까지 사용.
 */

export type Advertiser = {
  id: string;
  name: string;
  email: string;
  /** OCR 텍스트와 매칭할 때 사용할 키워드(광고물에 흔히 등장하는 표기) */
  searchTerms: string[];
};

const TEST_EMAIL = "woolela@nasmedia.co.kr";

export const DUMMY_ADVERTISERS: Advertiser[] = [
  {
    id: "adv-ssg",
    name: "에스에스지닷컴",
    email: TEST_EMAIL,
    searchTerms: ["SSG.COM", "SSG", "에스에스지닷컴", "에스에스지"],
  },
  {
    id: "adv-ploud",
    name: "플라우드코리아",
    email: TEST_EMAIL,
    searchTerms: ["플라우드코리아", "플라우드", "Ploud"],
  },
  {
    id: "adv-kakaobank",
    name: "카카오뱅크",
    email: TEST_EMAIL,
    searchTerms: ["카카오뱅크", "KakaoBank", "카카오 뱅크"],
  },
  {
    id: "adv-swu",
    name: "서울여자대학교",
    email: TEST_EMAIL,
    searchTerms: ["서울여자대학교", "서울여대", "SEOUL WOMEN'S UNIVERSITY", "SWU"],
  },
  {
    id: "adv-at",
    name: "한국농수산식품유통공사",
    email: TEST_EMAIL,
    searchTerms: ["한국농수산식품유통공사", "aT", "농수산식품유통공사"],
  },
  {
    id: "adv-lg",
    name: "LG전자",
    email: TEST_EMAIL,
    searchTerms: ["LG전자", "LG DIOS", "LG 식기세척기", "LGE.COM", "엘지", "LG이닷컴"],
  },
  {
    id: "adv-chungnam",
    name: "충남혁신도시",
    email: TEST_EMAIL,
    searchTerms: ["충남혁신도시", "충남 혁신도시"],
  },
  {
    id: "adv-sen",
    name: "서울특별시교육청",
    email: TEST_EMAIL,
    searchTerms: [
      "서울특별시교육청",
      "서울특별시교육청보건안전진흥원",
      "서울시교육청",
    ],
  },
  {
    id: "adv-bdh",
    name: "배두훈팬클럽",
    email: TEST_EMAIL,
    searchTerms: ["배두훈팬클럽", "배두훈"],
  },
  {
    id: "adv-vip",
    name: "브이아이피자산",
    email: TEST_EMAIL,
    searchTerms: [
      "vip 자산운용",
      "브이아이피자산운용",
      "브이아이피자산",
      "VIP 자산운용",
      "VIP Asset",
    ],
  },
];
