/** sessionStorage 키: 촬영 직후 확인 페이지로 전달하는 데이터 */
export const CAPTURE_SESSION_KEY = "admate_capture_data";

export type CaptureSessionData = {
  imageDataUrl: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  capturedAt: string;
};
