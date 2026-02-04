/**
 * 광고주 정보 타입.
 * OCR 매칭 시 id, name, email, searchTerms 사용.
 */

export type Advertiser = {
  id: string;
  name: string;
  email: string;
  contactName: string | null;
  campaignManagerName: string;
  campaignManagerEmail: string;
  searchTerms: string[];
  createdAt: string;
  updatedAt: string;
};
