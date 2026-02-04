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
    searchTerms: [
      "SSG.COM",
      "SSG",
      "에스에스지닷컴",
      "에스에스지",
      "이마트",
      "이마트몰",
    ],
  },
  {
    id: "adv-ploud",
    name: "플라우드코리아",
    email: TEST_EMAIL,
    searchTerms: [
      "플라우드코리아",
      "플라우드",
      "Ploud",
      "플라우드 코리아",
      "Ploud Korea",
    ],
  },
  {
    id: "adv-kakaobank",
    name: "카카오뱅크",
    email: TEST_EMAIL,
    searchTerms: [
      "카카오뱅크",
      "KakaoBank",
      "카카오 뱅크",
      "카카오뱅크 X",
      "경기신용보증재단",
      "상생보증대출",
      "소상공인",
      "보증대출",
      "상생보증",
    ],
  },
  {
    id: "adv-swu",
    name: "서울여자대학교",
    email: TEST_EMAIL,
    searchTerms: [
      "서울여자대학교",
      "서울여대",
      "SEOUL WOMEN'S UNIVERSITY",
      "SWU",
      "서울 여자 대학교",
      "서울 여대",
      "담대하게",
      "admission.swu",
      "2026학년도",
      "신편입학",
      "편입학 모집",
    ],
  },
  {
    id: "adv-at",
    name: "한국농수산식품유통공사",
    email: TEST_EMAIL,
    searchTerms: [
      "한국농수산식품유통공사",
      "한국 농수산식품유통공사",
      "농수산식품유통공사",
      "농수산",
      "농림축산식품부",
      "FSQUARE",
      "감사가 꽃피는",
      "꽃을 더하세요",
    ],
  },
  {
    id: "adv-lg",
    name: "LG전자",
    email: TEST_EMAIL,
    searchTerms: [
      "LG전자",
      "LG DIOS",
      "LG 식기세척기",
      "LGE.COM",
      "엘지이닷컴",
      "LG이닷컴",
      "트루스팀",
      "식기세척기",
      "DIOS 식기세척기",
      "LG",
      "구매자 87",
      "TRUE REPORT",
      "엘지",
    ],
  },
  {
    id: "adv-chungnam",
    name: "충남혁신도시",
    email: TEST_EMAIL,
    searchTerms: [
      "충남혁신도시",
      "충남 혁신도시",
      "충남 혁신 도시",
      "혁신도시",
      "환황해권",
      "서해선",
    ],
  },
  {
    id: "adv-sen",
    name: "서울특별시교육청",
    email: TEST_EMAIL,
    searchTerms: [
      "서울특별시교육청",
      "서울특별시교육청보건안전진흥원",
      "서울시교육청",
      "교육청",
      "보건안전진흥원",
      "건강한 서울 학교",
      "흡연",
      "마약 예방",
    ],
  },
  {
    id: "adv-bdh",
    name: "배두훈팬클럽",
    email: TEST_EMAIL,
    searchTerms: ["배두훈팬클럽", "배두훈", "배 두훈"],
  },
  {
    id: "adv-vip",
    name: "브이아이피자산",
    email: TEST_EMAIL,
    searchTerms: [
      "vip 자산운용",
      "vip자산운용",
      "vip 자산운영",
      "브이아이피자산운용",
      "브이아이피자산",
      "브이아이피",
      "VIP 자산운용",
      "VIP Asset",
      "자산운용",
      "자산운영",
      "직장생활",
      "주식",
      "그래서 우리가 공부한다",
    ],
  },
];
