export const AREA_CODE_MAP: Record<string, string> = {
  "서울": "100",
  "강원": "200",
  "대전": "300",
  "충남": "312",
  "세종": "338",
  "충북": "360",
  "인천": "400",
  "경기": "410",
  "광주": "500",
  "전남": "513",
  "전북": "560",
  "부산": "600",
  "경남": "621",
  "울산": "680",
  "제주": "690",
  "대구": "700",
  "경북": "712",
};

export const AREA_CODE_TO_FULL: Record<string, string> = {
  "100": "서울특별시",
  "200": "강원도",
  "300": "대전광역시",
  "312": "충청남도",
  "338": "세종특별자치시",
  "360": "충청북도",
  "400": "인천광역시",
  "410": "경기도",
  "500": "광주광역시",
  "513": "전라남도",
  "560": "전라북도",
  "600": "부산광역시",
  "621": "경상남도",
  "680": "울산광역시",
  "690": "제주특별자치도",
  "700": "대구광역시",
  "712": "경상북도",
};

export const SIDO_LIST_WITH_CODE = Object.entries(AREA_CODE_MAP).map(([name, code]) => ({ name, code }));

export const API_BASES = {
  gonggo: "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1",
  gyeongjaengnyul: "https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1",
  stat: "https://api.odcloud.kr/api/ApplyhomeStatSvc/v1",
};
