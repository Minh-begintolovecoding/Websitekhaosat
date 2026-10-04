export type ExperimentalGroup = 'CONTROL' | 'SCARCITY' | 'SNEAKING' | 'BOTH';

export interface ParticipantSessionData {
  participantUuid: string;
  groupType: ExperimentalGroup;
  hasSubmitted: boolean;
  createdAt?: string;
}

export interface SurveyAnswers {
  // Demographics
  gender?: 'Nam' | 'Nữ' | 'Khác' | string;
  ageGroup?: '18-22' | '23-30' | '31-40' | '41+' | string;
  onlineShoppingFreq?:
    | 'Dưới 1 lần/tháng'
    | '1-3 lần/tháng'
    | '4-10 lần/tháng'
    | 'Trên 10 lần/tháng'
    | string;
  education?: 'Cao đẳng' | 'Đại học' | 'Sau đại học' | 'Khác' | string;
  occupation?: 'Sinh viên' | 'Nhân viên văn phòng' | 'Kinh doanh' | 'Khác' | string;

  // Quality (QUAL1 - QUAL4) Semantic Differential
  qual1?: number;
  qual2?: number;
  qual3?: number;
  qual4?: number;

  // Quantity (QUAN1 - QUAN4) Semantic Differential
  quan1?: number;
  quan2?: number;
  quan3?: number;
  quan4?: number;

  // Relevance (REL1 - REL3) Semantic Differential
  rel1?: number;
  rel2?: number;
  rel3?: number;

  // Clarity (CLA1 - CLA4) Semantic Differential
  cla1?: number;
  cla2?: number;
  cla3?: number;
  cla4?: number;

  // Perceived Customer Manipulation (PCM1 - PCM6) Likert
  pcm1?: number;
  pcm2?: number;
  pcm3?: number;
  pcm4?: number;
  pcm5?: number;
  pcm6?: number;

  // Attitude Toward Website (ATT1 - ATT4) Semantic Differential
  att1?: number;
  att2?: number;
  att3?: number;
  att4?: number;

  // Purchase Intention (PI1 - PI3) Likert
  pi1?: number;
  pi2?: number;
  pi3?: number;

  // Loyalty Intention (LOY1 - LOY3) Likert
  loy1?: number;
  loy2?: number;
  loy3?: number;

  // Online Shopping Familiarity (FAM1 - FAM4) Likert
  fam1?: number;
  fam2?: number;
  fam3?: number;
  fam4?: number;

  // Attention Check (AC1 - Correct is 6)
  ac1?: number;

  // Manipulation Checks (Concrete options)
  sc1?: string | null;
  sc2?: string | null;
  sn1?: string | null;
}

export interface TimingMetrics {
  enteredProductPageAt?: number;
  productPageDuration: number; // in seconds
  enteredCartPageAt?: number;
  cartPageDuration: number; // in seconds
  startedSurveyAt?: number;
  surveyDuration: number; // in seconds
  totalDuration: number; // in seconds
}

export interface GroupMetricItem {
  groupType: string;
  targetCount: number;
  totalParticipants: number;
  completedResponses: number;
  dropoutCount: number;
  completionRate: number;
  avgProductDuration: number;
  avgCartDuration: number;
  avgSurveyDuration: number;
  speedingCount: number;
  failedManipulationCount: number;
  failedAttentionCount: number;
  meanQual: number;
  meanQuan: number;
  meanRel: number;
  meanCla: number;
  meanPcm: number;
  meanAtt: number;
  meanPi: number;
  meanLoy: number;
  meanFam: number;
}

export interface ReliabilityMetrics {
  construct: string;
  label: string;
  itemCount: number;
  cronbachAlpha: number;
  targetAlpha: number;
  passed: boolean;
}

export interface CorrelationPair {
  var1: string;
  var2: string;
  label: string;
  r: number;
  targetR: number;
  direction: 'positive' | 'negative';
}

export interface GroupComparisonItem {
  groupType: string;
  n: number;
  targetQual: number;
  actualQual: number;
  targetQuan: number;
  actualQuan: number;
  targetRel: number;
  actualRel: number;
  targetCla: number;
  actualCla: number;
  targetPcm: number;
  actualPcm: number;
  targetAtt: number;
  actualAtt: number;
  targetPi: number;
  actualPi: number;
  targetLoy: number;
  actualLoy: number;
}

export interface SemValidationData {
  reliability: ReliabilityMetrics[];
  correlations: CorrelationPair[];
  groupComparison: GroupComparisonItem[];
}

export interface DashboardMetrics {
  totalParticipants: number;
  completedResponses: number;
  totalDropouts: number;
  overallCompletionRate: number;
  overallDropoutRate: number;
  speedingRate: number;
  manipulationFailureRate: number;
  attentionFailureRate: number;
  avgProductPageDuration: number;
  avgCartDuration: number;
  avgSurveyDuration: number;
  avgTotalDuration: number;
  groups: Record<string, GroupMetricItem>;
  semValidation?: SemValidationData;
}

export interface RawResponseItem {
  responseId: number;
  participantUuid: string;
  groupType: string;
  qual1: number;
  qual2: number;
  qual3: number;
  qual4: number;
  quan1: number;
  quan2: number;
  quan3: number;
  quan4: number;
  rel1: number;
  rel2: number;
  rel3: number;
  cla1: number;
  cla2: number;
  cla3: number;
  cla4: number;
  pcm1: number;
  pcm2: number;
  pcm3: number;
  pcm4: number;
  pcm5: number;
  pcm6: number;
  att1: number;
  att2: number;
  att3: number;
  att4: number;
  pi1: number;
  pi2: number;
  pi3: number;
  loy1: number;
  loy2: number;
  loy3: number;
  fam1: number;
  fam2: number;
  fam3: number;
  fam4: number;
  ac1?: number | null;
  sc1?: string | null;
  sc2?: string | null;
  sn1?: string | null;
  productPageDuration: number;
  cartPageDuration: number;
  surveyDuration: number;
  totalDuration: number;
  isSpeeding: boolean;
  failedManipulation: boolean;
  failedAttention: boolean;
  gender?: string | null;
  ageGroup?: string | null;
  onlineShoppingFreq?: string | null;
  education?: string | null;
  occupation?: string | null;
  startedAt: string;
  submittedAt: string;
}
