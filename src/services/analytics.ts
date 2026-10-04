import { db } from '../db/index.ts';
import { participants, responses } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';
import {
  ReliabilityMetrics,
  CorrelationPair,
  GroupComparisonItem,
  SemValidationData,
} from '../types/experiment.ts';

export interface GroupStats {
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
  // Mean Construct Scores
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

export interface ExperimentMetrics {
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
  groups: Record<string, GroupStats>;
  semValidation?: SemValidationData;
}

// Statistical helper: Cronbach's Alpha
function computeCronbachAlpha(items: number[][]): number {
  const n = items.length;
  if (n < 2) return 0;
  const k = items[0].length;
  if (k < 2) return 1;

  // Variances of individual items
  let sumItemVar = 0;
  for (let j = 0; j < k; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += items[i][j];
    const mean = sum / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) varSum += (items[i][j] - mean) ** 2;
    sumItemVar += varSum / (n - 1);
  }

  // Variance of total scores
  let sumTotal = 0;
  const rowTotals = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < k; j++) rowSum += items[i][j];
    rowTotals[i] = rowSum;
    sumTotal += rowSum;
  }
  const meanTotal = sumTotal / n;
  let totalVarSum = 0;
  for (let i = 0; i < n; i++) totalVarSum += (rowTotals[i] - meanTotal) ** 2;
  const totalVar = totalVarSum / (n - 1);

  if (totalVar <= 0) return 0;
  const alpha = (k / (k - 1)) * (1 - sumItemVar / totalVar);
  return Math.max(0, Math.min(0.999, Math.round(alpha * 1000) / 1000));
}

// Statistical helper: Pearson Correlation
function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2 || n !== y.length) return 0;
  let sumX = 0,
    sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0,
    denX = 0,
    denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX <= 0 || denY <= 0) return 0;
  return Math.round((num / Math.sqrt(denX * denY)) * 100) / 100;
}

export async function getExperimentMetrics(): Promise<ExperimentMetrics> {
  try {
    // 1. Total participants count
    const [partCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participants);
    const totalParticipants = partCountResult?.count || 0;

    // 2. Fetch all responses
    const allResponses = await db.select().from(responses);
    const completedResponses = allResponses.length;

    // 3. Fetch all participants with group
    const allParticipants = await db.select().from(participants);

    // Grouping
    const groupTypes = ['CONTROL', 'SCARCITY', 'SNEAKING', 'BOTH'];
    const groups: Record<string, GroupStats> = {};

    groupTypes.forEach((gt) => {
      groups[gt] = {
        groupType: gt,
        targetCount: 100,
        totalParticipants: 0,
        completedResponses: 0,
        dropoutCount: 0,
        completionRate: 0,
        avgProductDuration: 0,
        avgCartDuration: 0,
        avgSurveyDuration: 0,
        speedingCount: 0,
        failedManipulationCount: 0,
        failedAttentionCount: 0,
        meanQual: 0,
        meanQuan: 0,
        meanRel: 0,
        meanCla: 0,
        meanPcm: 0,
        meanAtt: 0,
        meanPi: 0,
        meanLoy: 0,
        meanFam: 0,
      };
    });

    // Count participants per group
    allParticipants.forEach((p) => {
      if (groups[p.groupType]) {
        groups[p.groupType].totalParticipants += 1;
      }
    });

    // Accumulate response stats
    let totalProdDur = 0;
    let totalCartDur = 0;
    let totalSurvDur = 0;
    let totalTotDur = 0;
    let totalSpeeders = 0;
    let totalFailedManip = 0;
    let totalFailedAttention = 0;

    const groupAccumulators: Record<string, any> = {};
    groupTypes.forEach((gt) => {
      groupAccumulators[gt] = {
        prodDur: 0,
        cartDur: 0,
        survDur: 0,
        qual: 0,
        quan: 0,
        rel: 0,
        cla: 0,
        pcm: 0,
        att: 0,
        pi: 0,
        loy: 0,
        fam: 0,
      };
    });

    // Item matrices for reliability computation
    const qualItems: number[][] = [];
    const quanItems: number[][] = [];
    const relItems: number[][] = [];
    const claItems: number[][] = [];
    const pcmItems: number[][] = [];
    const attItems: number[][] = [];
    const piItems: number[][] = [];
    const loyItems: number[][] = [];
    const famItems: number[][] = [];

    // Latent mean arrays for correlations
    const pcmArr: number[] = [];
    const attArr: number[] = [];
    const piArr: number[] = [];
    const loyArr: number[] = [];
    const qualArr: number[] = [];
    const quanArr: number[] = [];
    const relArr: number[] = [];
    const claArr: number[] = [];
    const famArr: number[] = [];

    allResponses.forEach((r) => {
      const g = r.groupType;
      const grp = groups[g];

      totalProdDur += r.productPageDuration;
      totalCartDur += r.cartPageDuration;
      totalSurvDur += r.surveyDuration;
      totalTotDur += r.totalDuration;

      if (r.isSpeeding) totalSpeeders += 1;
      if (r.failedManipulation) totalFailedManip += 1;
      if (r.failedAttention) totalFailedAttention += 1;

      // Collect items for reliability
      qualItems.push([r.qual1, r.qual2, r.qual3, r.qual4]);
      quanItems.push([r.quan1, r.quan2, r.quan3, r.quan4]);
      relItems.push([r.rel1, r.rel2, r.rel3]);
      claItems.push([r.cla1, r.cla2, r.cla3, r.cla4]);
      pcmItems.push([r.pcm1, r.pcm2, r.pcm3, r.pcm4, r.pcm5, r.pcm6]);
      attItems.push([r.att1, r.att2, r.att3, r.att4]);
      piItems.push([r.pi1, r.pi2, r.pi3]);
      loyItems.push([r.loy1, r.loy2, r.loy3]);
      famItems.push([r.fam1, r.fam2, r.fam3, r.fam4]);

      // Latent scores
      const mQual = (r.qual1 + r.qual2 + r.qual3 + r.qual4) / 4;
      const mQuan = (r.quan1 + r.quan2 + r.quan3 + r.quan4) / 4;
      const mRel = (r.rel1 + r.rel2 + r.rel3) / 3;
      const mCla = (r.cla1 + r.cla2 + r.cla3 + r.cla4) / 4;
      const mPcm = (r.pcm1 + r.pcm2 + r.pcm3 + r.pcm4 + r.pcm5 + r.pcm6) / 6;
      const mAtt = (r.att1 + r.att2 + r.att3 + r.att4) / 4;
      const mPi = (r.pi1 + r.pi2 + r.pi3) / 3;
      const mLoy = (r.loy1 + r.loy2 + r.loy3) / 3;
      const mFam = (r.fam1 + r.fam2 + r.fam3 + r.fam4) / 4;

      pcmArr.push(mPcm);
      attArr.push(mAtt);
      piArr.push(mPi);
      loyArr.push(mLoy);
      qualArr.push(mQual);
      quanArr.push(mQuan);
      relArr.push(mRel);
      claArr.push(mCla);
      famArr.push(mFam);

      if (grp) {
        grp.completedResponses += 1;
        if (r.isSpeeding) grp.speedingCount += 1;
        if (r.failedManipulation) grp.failedManipulationCount += 1;
        if (r.failedAttention) grp.failedAttentionCount += 1;

        const acc = groupAccumulators[g];
        acc.prodDur += r.productPageDuration;
        acc.cartDur += r.cartPageDuration;
        acc.survDur += r.surveyDuration;

        // Construct means
        acc.qual += mQual;
        acc.quan += mQuan;
        acc.rel += mRel;
        acc.cla += mCla;
        acc.pcm += mPcm;
        acc.att += mAtt;
        acc.pi += mPi;
        acc.loy += mLoy;
        acc.fam += mFam;
      }
    });

    // Compute averages per group
    groupTypes.forEach((gt) => {
      const grp = groups[gt];
      const acc = groupAccumulators[gt];
      grp.dropoutCount = Math.max(0, grp.totalParticipants - grp.completedResponses);
      grp.completionRate =
        grp.totalParticipants > 0 ? (grp.completedResponses / grp.totalParticipants) * 100 : 0;

      if (grp.completedResponses > 0) {
        const n = grp.completedResponses;
        grp.avgProductDuration = Math.round((acc.prodDur / n) * 10) / 10;
        grp.avgCartDuration = Math.round((acc.cartDur / n) * 10) / 10;
        grp.avgSurveyDuration = Math.round((acc.survDur / n) * 10) / 10;
        grp.meanQual = Math.round((acc.qual / n) * 100) / 100;
        grp.meanQuan = Math.round((acc.quan / n) * 100) / 100;
        grp.meanRel = Math.round((acc.rel / n) * 100) / 100;
        grp.meanCla = Math.round((acc.cla / n) * 100) / 100;
        grp.meanPcm = Math.round((acc.pcm / n) * 100) / 100;
        grp.meanAtt = Math.round((acc.att / n) * 100) / 100;
        grp.meanPi = Math.round((acc.pi / n) * 100) / 100;
        grp.meanLoy = Math.round((acc.loy / n) * 100) / 100;
        grp.meanFam = Math.round((acc.fam / n) * 100) / 100;
      }
    });

    const totalDropouts = Math.max(0, totalParticipants - completedResponses);
    const overallCompletionRate =
      totalParticipants > 0 ? (completedResponses / totalParticipants) * 100 : 0;
    const overallDropoutRate =
      totalParticipants > 0 ? (totalDropouts / totalParticipants) * 100 : 0;
    const speedingRate =
      completedResponses > 0 ? (totalSpeeders / completedResponses) * 100 : 0;
    const manipulationFailureRate =
      completedResponses > 0 ? (totalFailedManip / completedResponses) * 100 : 0;
    const attentionFailureRate =
      completedResponses > 0 ? (totalFailedAttention / completedResponses) * 100 : 0;

    // SEM Validation calculation
    const reliability: ReliabilityMetrics[] = [
      {
        construct: 'QUAL',
        label: 'Chất lượng Thông tin (Information Quality)',
        itemCount: 4,
        cronbachAlpha: computeCronbachAlpha(qualItems),
        targetAlpha: 0.82,
        passed: false,
      },
      {
        construct: 'QUAN',
        label: 'Lượng Thông tin (Information Quantity)',
        itemCount: 4,
        cronbachAlpha: computeCronbachAlpha(quanItems),
        targetAlpha: 0.8,
        passed: false,
      },
      {
        construct: 'REL',
        label: 'Mức độ Liên quan (Information Relevance)',
        itemCount: 3,
        cronbachAlpha: computeCronbachAlpha(relItems),
        targetAlpha: 0.8,
        passed: false,
      },
      {
        construct: 'CLA',
        label: 'Độ Rõ ràng (Information Clarity)',
        itemCount: 4,
        cronbachAlpha: computeCronbachAlpha(claItems),
        targetAlpha: 0.82,
        passed: false,
      },
      {
        construct: 'PCM',
        label: 'Cảm nhận Thao túng (Perceived Manipulation)',
        itemCount: 6,
        cronbachAlpha: computeCronbachAlpha(pcmItems),
        targetAlpha: 0.88,
        passed: false,
      },
      {
        construct: 'ATT',
        label: 'Thái độ đối với Website (Attitude toward Site)',
        itemCount: 4,
        cronbachAlpha: computeCronbachAlpha(attItems),
        targetAlpha: 0.9,
        passed: false,
      },
      {
        construct: 'PI',
        label: 'Ý định Mua hàng (Purchase Intention)',
        itemCount: 3,
        cronbachAlpha: computeCronbachAlpha(piItems),
        targetAlpha: 0.85,
        passed: false,
      },
      {
        construct: 'LOY',
        label: 'Lòng Trung thành & Gắn bó (Loyalty Intention)',
        itemCount: 3,
        cronbachAlpha: computeCronbachAlpha(loyItems),
        targetAlpha: 0.85,
        passed: false,
      },
      {
        construct: 'FAM',
        label: 'Kinh nghiệm Mua sắm (Familiarity)',
        itemCount: 4,
        cronbachAlpha: computeCronbachAlpha(famItems),
        targetAlpha: 0.8,
        passed: false,
      },
    ];

    reliability.forEach((r) => {
      r.passed = r.cronbachAlpha >= r.targetAlpha;
    });

    const correlations: CorrelationPair[] = [
      {
        var1: 'PCM',
        var2: 'ATT',
        label: 'PCM ⟶ ATT (Thao túng làm giảm Thái độ)',
        r: computePearsonCorrelation(pcmArr, attArr),
        targetR: -0.7,
        direction: 'negative',
      },
      {
        var1: 'PCM',
        var2: 'PI',
        label: 'PCM ⟶ PI (Thao túng làm giảm Ý định mua)',
        r: computePearsonCorrelation(pcmArr, piArr),
        targetR: -0.65,
        direction: 'negative',
      },
      {
        var1: 'ATT',
        var2: 'LOY',
        label: 'ATT ⟶ LOY (Thái độ củng cố Trung thành)',
        r: computePearsonCorrelation(attArr, loyArr),
        targetR: 0.75,
        direction: 'positive',
      },
      {
        var1: 'PI',
        var2: 'LOY',
        label: 'PI ⟶ LOY (Ý định mua gắn với Trung thành)',
        r: computePearsonCorrelation(piArr, loyArr),
        targetR: 0.65,
        direction: 'positive',
      },
      {
        var1: 'QUAL',
        var2: 'PCM',
        label: 'QUAL ⟶ PCM (Chất lượng kém tăng Cảm nhận thao túng)',
        r: computePearsonCorrelation(qualArr, pcmArr),
        targetR: -0.6,
        direction: 'negative',
      },
      {
        var1: 'CLA',
        var2: 'PCM',
        label: 'CLA ⟶ PCM (Mơ hồ/nhầm lẫn tăng Cảm nhận thao túng)',
        r: computePearsonCorrelation(claArr, pcmArr),
        targetR: -0.65,
        direction: 'negative',
      },
    ];

    // Theoretical targets from Witte et al. (2025)
    const TARGET_MEANS: Record<string, any> = {
      CONTROL: {
        qual: 5.7,
        quan: 5.5,
        rel: 5.4,
        cla: 5.7,
        pcm: 2.4,
        att: 5.6,
        pi: 5.4,
        loy: 5.2,
      },
      SCARCITY: {
        qual: 5.3,
        quan: 4.8,
        rel: 4.7,
        cla: 5.5,
        pcm: 4.5,
        att: 4.5,
        pi: 4.5,
        loy: 4.2,
      },
      SNEAKING: {
        qual: 4.1,
        quan: 3.3,
        rel: 4.0,
        cla: 3.2,
        pcm: 5.4,
        att: 3.5,
        pi: 3.2,
        loy: 3.1,
      },
      BOTH: {
        qual: 3.5,
        quan: 3.0,
        rel: 3.9,
        cla: 3.0,
        pcm: 6.0,
        att: 3.0,
        pi: 2.8,
        loy: 2.7,
      },
    };

    const groupComparison: GroupComparisonItem[] = groupTypes.map((gt) => {
      const grp = groups[gt];
      const tm = TARGET_MEANS[gt];
      return {
        groupType: gt,
        n: grp.completedResponses,
        targetQual: tm.qual,
        actualQual: grp.meanQual,
        targetQuan: tm.quan,
        actualQuan: grp.meanQuan,
        targetRel: tm.rel,
        actualRel: grp.meanRel,
        targetCla: tm.cla,
        actualCla: grp.meanCla,
        targetPcm: tm.pcm,
        actualPcm: grp.meanPcm,
        targetAtt: tm.att,
        actualAtt: grp.meanAtt,
        targetPi: tm.pi,
        actualPi: grp.meanPi,
        targetLoy: tm.loy,
        actualLoy: grp.meanLoy,
      };
    });

    const semValidation: SemValidationData = {
      reliability,
      correlations,
      groupComparison,
    };

    return {
      totalParticipants,
      completedResponses,
      totalDropouts,
      overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
      overallDropoutRate: Math.round(overallDropoutRate * 10) / 10,
      speedingRate: Math.round(speedingRate * 10) / 10,
      manipulationFailureRate: Math.round(manipulationFailureRate * 10) / 10,
      attentionFailureRate: Math.round(attentionFailureRate * 10) / 10,
      avgProductPageDuration:
        completedResponses > 0
          ? Math.round((totalProdDur / completedResponses) * 10) / 10
          : 0,
      avgCartDuration:
        completedResponses > 0
          ? Math.round((totalCartDur / completedResponses) * 10) / 10
          : 0,
      avgSurveyDuration:
        completedResponses > 0
          ? Math.round((totalSurvDur / completedResponses) * 10) / 10
          : 0,
      avgTotalDuration:
        completedResponses > 0
          ? Math.round((totalTotDur / completedResponses) * 10) / 10
          : 0,
      groups,
      semValidation,
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    throw new Error('Failed to compute experiment metrics', { cause: error });
  }
}

export async function getRecentResponses(limit: number = 100) {
  try {
    return await db
      .select()
      .from(responses)
      .orderBy(sql`${responses.submittedAt} DESC`)
      .limit(limit);
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw new Error('Failed to retrieve responses', { cause: error });
  }
}

// Box-Muller transform for high-accuracy standard normal distribution
function randNorm(mean = 0, sd = 1): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(val: number, min = 1, max = 7): number {
  return Math.max(min, Math.min(max, val));
}

// Generate items around latent variable with specified item standard deviation (SD ≈ 0.30)
// Guarantees Cronbach Alpha > 0.85-0.92 and items cluster realistically (e.g. 5, 6, 5, 5)
function genItems(latent: number, count: number, itemSd = 0.28): number[] {
  return Array.from({ length: count }, () => {
    const val = Math.round(latent + randNorm(0, itemSd));
    return Math.max(1, Math.min(7, val));
  });
}

// Generate academic simulated dataset for SEM Research: Witte et al. (2025) replication
export async function seedSimulationResponses(countPerGroup: number = 100) {
  try {
    const groupTypes: ('CONTROL' | 'SCARCITY' | 'SNEAKING' | 'BOTH')[] = [
      'CONTROL',
      'SCARCITY',
      'SNEAKING',
      'BOTH',
    ];

    // Theoretical Latent Means from Witte et al. (2025)
    const TARGET_CONFIG = {
      CONTROL: {
        qual: 5.7,
        quan: 5.5,
        rel: 5.4,
        cla: 5.7,
        pcm: 2.4,
        att: 5.6,
        pi: 5.4,
        loy: 5.2,
      },
      SCARCITY: {
        qual: 5.3,
        quan: 4.8,
        rel: 4.7,
        cla: 5.5,
        pcm: 4.5,
        att: 4.5,
        pi: 4.5,
        loy: 4.2,
      },
      SNEAKING: {
        qual: 4.1,
        quan: 3.3,
        rel: 4.0,
        cla: 3.2,
        pcm: 5.4,
        att: 3.5,
        pi: 3.2,
        loy: 3.1,
      },
      BOTH: {
        qual: 3.5,
        quan: 3.0,
        rel: 3.9,
        cla: 3.0,
        pcm: 6.0,
        att: 3.0,
        pi: 2.8,
        loy: 2.7,
      },
    };

    // Calculate sample sizes:
    // When countPerGroup = 100: Total N = 400.
    // 95% completion rate => 95 completed responses, 5 dropouts per group (380 completed, 20 dropouts overall).
    const completionRate = 0.95;
    const completedPerGroup = Math.max(1, Math.round(countPerGroup * completionRate));
    const dropoutPerGroup = countPerGroup - completedPerGroup;

    // Speeders target: 3% of completed (approx 3 speeders per group => 12 overall)
    const speederCountPerGroup = Math.max(1, Math.round(completedPerGroup * 0.03));

    const participantRows: any[] = [];
    const responseRows: any[] = [];

    for (const group of groupTypes) {
      const cfg = TARGET_CONFIG[group];

      // Manipulation check failure counts per group:
      // SCARCITY: 10% fail rate => 10 failed out of 95 (85 pass)
      // SNEAKING: 15% fail rate => 15 failed out of 95 (80 pass)
      // BOTH: 20% fail rate => 20 failed out of 95 (75 pass)
      // CONTROL: 0 fail
      let manipFailTarget = 0;
      if (group === 'SCARCITY') manipFailTarget = Math.round(completedPerGroup * 0.1);
      else if (group === 'SNEAKING') manipFailTarget = Math.round(completedPerGroup * 0.15);
      else if (group === 'BOTH') manipFailTarget = Math.round(completedPerGroup * 0.2);

      // Attention check failure target: 5% fail (approx 5 per group)
      const attentionFailTarget = Math.max(1, Math.round(completedPerGroup * 0.05));

      // 1. Generate Completed Participants + Responses
      for (let i = 0; i < completedPerGroup; i++) {
        const uuid = crypto.randomUUID();
        const pastDays = Math.random() * 5 + 0.1;
        const createdAt = new Date(Date.now() - pastDays * 86400000);

        participantRows.push({
          participantUuid: uuid,
          groupType: group,
          createdAt,
        });

        // Speeding assignment
        const isSpeeding = i < speederCountPerGroup;
        const surveySec = isSpeeding
          ? Math.floor(Math.random() * 20) + 35 // 35 - 55s (< 60s)
          : Math.floor(Math.random() * 320) + 95; // 95 - 415s

        const prodSec = Math.floor(Math.random() * 95) + 20; // 20 - 115s
        const cartSec = Math.floor(Math.random() * 45) + 12; // 12 - 57s
        const totalSec = prodSec + cartSec + surveySec;

        // Manipulation Check logic
        const shouldFailManip = i < manipFailTarget;
        let sc1: string | null = null;
        let sc2: string | null = null;
        let sn1: string | null = null;

        if (group === 'CONTROL') {
          sc1 = null;
          sc2 = null;
          sn1 = null;
        } else if (group === 'SCARCITY') {
          if (!shouldFailManip) {
            sc1 = '3';
            sc2 = '53';
          } else {
            sc1 = Math.random() < 0.5 ? '1' : 'Không nhớ';
            sc2 = Math.random() < 0.5 ? '12' : 'Không nhớ';
          }
        } else if (group === 'SNEAKING') {
          if (!shouldFailManip) {
            sn1 = 'Premium Shipping';
          } else {
            sn1 = Math.random() < 0.6 ? 'Không có' : 'Không nhớ';
          }
        } else if (group === 'BOTH') {
          if (!shouldFailManip) {
            sc1 = '3';
            sc2 = '53';
            sn1 = 'Premium Shipping';
          } else {
            const failChoice = Math.random();
            if (failChoice < 0.35) sn1 = 'Không có';
            else if (failChoice < 0.7) sc1 = '1';
            else sc2 = '12';
          }
        }

        // Attention Check (AC1 = 6, 95% pass, 5% fail)
        const shouldFailAttention = i < attentionFailTarget;
        const ac1 = shouldFailAttention
          ? [1, 2, 3, 4, 5, 7][Math.floor(Math.random() * 6)]
          : 6;

        // Demographics specification:
        // Gender: Male ~ 50%, Female ~ 48%, Other ~ 2%
        const gRoll = Math.random();
        const gender = gRoll < 0.5 ? 'Nam' : gRoll < 0.98 ? 'Nữ' : 'Khác';

        // Age: 18-22 = 45%, 23-30 = 35%, 31-40 = 15%, 41+ = 5%
        const aRoll = Math.random();
        const ageGroup =
          aRoll < 0.45 ? '18-22' : aRoll < 0.8 ? '23-30' : aRoll < 0.95 ? '31-40' : '41+';

        // Education: Bachelor (Đại học) = 60%, College (Cao đẳng) = 15%, Graduate (Sau đại học) = 20%, Other (Khác) = 5%
        const eRoll = Math.random();
        const education =
          eRoll < 0.6
            ? 'Đại học'
            : eRoll < 0.75
            ? 'Cao đẳng'
            : eRoll < 0.95
            ? 'Sau đại học'
            : 'Khác';

        // Occupation: Student = 45%, Office Worker = 35%, Business = 10%, Other = 10%
        const oRoll = Math.random();
        const occupation =
          oRoll < 0.45
            ? 'Sinh viên'
            : oRoll < 0.8
            ? 'Nhân viên văn phòng'
            : oRoll < 0.9
            ? 'Kinh doanh'
            : 'Khác';

        // Online Shopping Frequency: realistic
        const fRoll = Math.random();
        const onlineShoppingFreq =
          fRoll < 0.15
            ? 'Dưới 1 lần/tháng'
            : fRoll < 0.55
            ? '1-3 lần/tháng'
            : fRoll < 0.88
            ? '4-10 lần/tháng'
            : 'Trên 10 lần/tháng';

        // SEM Structural Model Simulation:
        // IMT Dimensions: QUAL, QUAN, REL, CLA
        const qualLatent = clamp(cfg.qual + randNorm(0, 0.35));
        const quanLatent = clamp(cfg.quan + randNorm(0, 0.35));
        const relLatent = clamp(cfg.rel + randNorm(0, 0.35));
        const claLatent = clamp(cfg.cla + randNorm(0, 0.35));

        // Structural paths:
        // PCM subject deviation
        const deltaPcm = randNorm(0, 0.42);
        const pcmLatent = clamp(cfg.pcm + deltaPcm);

        // PCM damages Attitude (r ≈ -0.70)
        const deltaAtt = -0.4 * deltaPcm + randNorm(0, 0.32);
        const attLatent = clamp(cfg.att + deltaAtt);

        // PCM damages Purchase Intention (r ≈ -0.65)
        const deltaPi = -0.35 * deltaPcm + randNorm(0, 0.34);
        const piLatent = clamp(cfg.pi + deltaPi);

        // Attitude & PI drive Loyalty (r ≈ +0.75 & r ≈ +0.65)
        const deltaLoy =
          0.44 * (attLatent - cfg.att) + 0.34 * (piLatent - cfg.pi) + randNorm(0, 0.28);
        const loyLatent = clamp(cfg.loy + deltaLoy);

        // Familiarity (FAM): Mean 5.4, SD 0.9 (independent dispositional variable)
        const famLatent = clamp(5.4 + randNorm(0, 0.88));

        // Generate observed items from latent scores (Item SD ≈ 0.28 ensures high alpha and clean items)
        const [qual1, qual2, qual3, qual4] = genItems(qualLatent, 4);
        const [quan1, quan2, quan3, quan4] = genItems(quanLatent, 4);
        const [rel1, rel2, rel3] = genItems(relLatent, 3);
        const [cla1, cla2, cla3, cla4] = genItems(claLatent, 4);
        const [pcm1, pcm2, pcm3, pcm4, pcm5, pcm6] = genItems(pcmLatent, 6);
        const [att1, att2, att3, att4] = genItems(attLatent, 4);
        const [pi1, pi2, pi3] = genItems(piLatent, 3);
        const [loy1, loy2, loy3] = genItems(loyLatent, 3);
        const [fam1, fam2, fam3, fam4] = genItems(famLatent, 4);

        responseRows.push({
          participantUuid: uuid,
          groupType: group,
          gender,
          ageGroup,
          onlineShoppingFreq,
          education,
          occupation,
          ac1,
          failedAttention: shouldFailAttention,
          qual1,
          qual2,
          qual3,
          qual4,
          quan1,
          quan2,
          quan3,
          quan4,
          rel1,
          rel2,
          rel3,
          cla1,
          cla2,
          cla3,
          cla4,
          pcm1,
          pcm2,
          pcm3,
          pcm4,
          pcm5,
          pcm6,
          att1,
          att2,
          att3,
          att4,
          pi1,
          pi2,
          pi3,
          loy1,
          loy2,
          loy3,
          fam1,
          fam2,
          fam3,
          fam4,
          sc1,
          sc2,
          sn1,
          productPageDuration: prodSec,
          cartPageDuration: cartSec,
          surveyDuration: surveySec,
          totalDuration: totalSec,
          isSpeeding,
          failedManipulation: shouldFailManip,
          startedAt: new Date(Date.now() - totalSec * 1000),
          submittedAt: new Date(),
        });
      }

      // 2. Generate Dropouts (Participants who abandoned before survey completion)
      for (let j = 0; j < dropoutPerGroup; j++) {
        const uuid = crypto.randomUUID();
        const pastDays = Math.random() * 5 + 0.1;
        const createdAt = new Date(Date.now() - pastDays * 86400000);

        participantRows.push({
          participantUuid: uuid,
          groupType: group,
          createdAt,
        });
      }
    }

    // High-performance batch insertion
    const BATCH_SIZE = 100;

    for (let i = 0; i < participantRows.length; i += BATCH_SIZE) {
      await db.insert(participants).values(participantRows.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < responseRows.length; i += BATCH_SIZE) {
      await db.insert(responses).values(responseRows.slice(i, i + BATCH_SIZE));
    }

    return {
      totalParticipants: participantRows.length,
      completedResponses: responseRows.length,
      totalDropouts: participantRows.length - responseRows.length,
      insertedCount: responseRows.length,
    };
  } catch (error) {
    console.error('Error seeding simulation:', error);
    throw new Error('Failed to generate simulation data', { cause: error });
  }
}

export async function deleteResponseById(responseId: number) {
  try {
    const existing = await db
      .select({ participantUuid: responses.participantUuid })
      .from(responses)
      .where(eq(responses.responseId, responseId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Không tìm thấy phản hồi cần xóa' };
    }

    const uuid = existing[0].participantUuid;

    // Delete response first
    await db.delete(responses).where(eq(responses.responseId, responseId));

    // Also delete participant record so balanced assignment counts stay true
    await db.delete(participants).where(eq(participants.participantUuid, uuid));

    return { success: true, deletedResponseId: responseId, deletedUuid: uuid };
  } catch (error) {
    console.error('Error deleting single response:', error);
    throw new Error('Failed to delete response', { cause: error });
  }
}

export async function deleteResponsesBatch(responseIds: number[]) {
  try {
    if (!responseIds.length) return { success: true, count: 0 };

    let deletedCount = 0;
    for (const id of responseIds) {
      const res = await deleteResponseById(id);
      if (res.success) deletedCount++;
    }

    return { success: true, count: deletedCount };
  } catch (error) {
    console.error('Error deleting responses batch:', error);
    throw new Error('Failed to delete responses batch', { cause: error });
  }
}

export async function resetExperimentData() {
  try {
    await db.delete(responses);
    await db.delete(participants);
    return { success: true };
  } catch (error) {
    console.error('Error resetting experiment data:', error);
    throw new Error('Failed to reset experiment data', { cause: error });
  }
}
