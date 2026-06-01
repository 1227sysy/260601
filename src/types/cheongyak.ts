export interface GonggoItem {
  HOUSE_NM: string;
  HOUSE_SECD_NM: string;
  SIDO: string;
  SIGUNGU: string;
  HSSPLY_ADRES: string;
  RCRIT_PBLANC_DE: string;
  SUBSCRPT_AREA_CODE_NM: string;
  TOT_SUPLY_HSHLDCO: number;
  GNRL_HOSP_RCRIT_AT: string;
}

export interface GyeongjaengnyulItem {
  HOUSE_NM: string;
  SIDO: string;
  HOUSING_TYPE: string;
  COMPETITION_RATE: number;
  SPECIAL_SUPPLY: number;
  SCORE_AVG: number;
  SCORE_MIN: number;
  SCORE_MAX: number;
}

export interface DangjeonItem {
  SIDO: string;
  AGE_GBN: string;
  SCORE_RANK: string;
  APPLY_CNT: number;
  WIN_CNT: number;
  WIN_RATE: number;
}

export interface KPIData {
  monthlyGonggo: number;
  topCompetitionRate: number;
  avgScore: number;
  topWinAge: string;
}
