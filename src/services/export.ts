import { db } from '../db/index.ts';
import { responses } from '../db/schema.ts';
import * as XLSX from 'xlsx';

export interface FlatRecord {
  participant_id: string;
  group_type: string;
  group_num: number; // 1=CONTROL, 2=SCARCITY, 3=SNEAKING, 4=BOTH
  // Demographics
  gender: string;
  gender_num: number; // 1=Nam, 2=Nữ, 3=Khác
  age_group: string;
  age_num: number; // 1=18-22, 2=23-30, 3=31-40, 4=41+
  online_freq: string;
  online_freq_num: number; // 1=Dưới 1 lần, 2=1-3 lần, 3=4-10 lần, 4=Trên 10 lần
  education: string;
  education_num: number; // 1=Cao đẳng, 2=Đại học, 3=Sau đại học, 4=Khác
  occupation: string;
  occupation_num: number; // 1=Sinh viên, 2=Văn phòng, 3=Kinh doanh, 4=Khác
  // Quality (Semantic Differential)
  qual1: number;
  qual2: number;
  qual3: number;
  qual4: number;
  mean_qual: number;
  // Quantity (Semantic Differential)
  quan1: number;
  quan2: number;
  quan3: number;
  quan4: number;
  mean_quan: number;
  // Relevance (Semantic Differential)
  rel1: number;
  rel2: number;
  rel3: number;
  mean_rel: number;
  // Clarity (Semantic Differential)
  cla1: number;
  cla2: number;
  cla3: number;
  cla4: number;
  mean_cla: number;
  // Perceived Customer Manipulation
  pcm1: number;
  pcm2: number;
  pcm3: number;
  pcm4: number;
  pcm5: number;
  pcm6: number;
  mean_pcm: number;
  // Attitude
  att1: number;
  att2: number;
  att3: number;
  att4: number;
  mean_att: number;
  // Purchase Intention
  pi1: number;
  pi2: number;
  pi3: number;
  mean_pi: number;
  // Loyalty
  loy1: number;
  loy2: number;
  loy3: number;
  mean_loy: number;
  // Familiarity
  fam1: number;
  fam2: number;
  fam3: number;
  fam4: number;
  mean_fam: number;
  // Manipulation checks
  sc1: string;
  sc2: string;
  sn1: string;
  sc1_correct: number;
  sc2_correct: number;
  sn1_correct: number;
  // Attention check
  ac1: number;
  // Behavioral timings (seconds)
  product_page_sec: number;
  cart_page_sec: number;
  survey_sec: number;
  total_sec: number;
  // Quality control flags
  is_speeding: number; // 1 or 0
  failed_manipulation: number; // 1 or 0
  failed_attention: number; // 1 or 0
  started_at: string;
  submitted_at: string;
}

const GROUP_NUM_MAP: Record<string, number> = {
  CONTROL: 1,
  SCARCITY: 2,
  SNEAKING: 3,
  BOTH: 4,
};

export async function getFlatExportRecords(): Promise<FlatRecord[]> {
  const rows = await db.select().from(responses);

  return rows.map((r) => {
    const groupNum = GROUP_NUM_MAP[r.groupType] || 0;
    const meanQual = Math.round(((r.qual1 + r.qual2 + r.qual3 + r.qual4) / 4) * 100) / 100;
    const meanQuan = Math.round(((r.quan1 + r.quan2 + r.quan3 + r.quan4) / 4) * 100) / 100;
    const meanRel = Math.round(((r.rel1 + r.rel2 + r.rel3) / 3) * 100) / 100;
    const meanCla = Math.round(((r.cla1 + r.cla2 + r.cla3 + r.cla4) / 4) * 100) / 100;
    const meanPcm = Math.round(((r.pcm1 + r.pcm2 + r.pcm3 + r.pcm4 + r.pcm5 + r.pcm6) / 6) * 100) / 100;
    const meanAtt = Math.round(((r.att1 + r.att2 + r.att3 + r.att4) / 4) * 100) / 100;
    const meanPi = Math.round(((r.pi1 + r.pi2 + r.pi3) / 3) * 100) / 100;
    const meanLoy = Math.round(((r.loy1 + r.loy2 + r.loy3) / 3) * 100) / 100;
    const meanFam = Math.round(((r.fam1 + r.fam2 + r.fam3 + r.fam4) / 4) * 100) / 100;

    const genderNum = r.gender === 'Nam' ? 1 : r.gender === 'Nữ' ? 2 : r.gender ? 3 : 0;
    const ageNum =
      r.ageGroup === '18-22'
        ? 1
        : r.ageGroup === '23-30'
        ? 2
        : r.ageGroup === '31-40'
        ? 3
        : r.ageGroup === '41+'
        ? 4
        : 0;
    const freqNum =
      r.onlineShoppingFreq === 'Dưới 1 lần/tháng'
        ? 1
        : r.onlineShoppingFreq === '1-3 lần/tháng'
        ? 2
        : r.onlineShoppingFreq === '4-10 lần/tháng'
        ? 3
        : r.onlineShoppingFreq === 'Trên 10 lần/tháng'
        ? 4
        : 0;

    const eduNum =
      r.education === 'Cao đẳng'
        ? 1
        : r.education === 'Đại học'
        ? 2
        : r.education === 'Sau đại học'
        ? 3
        : r.education
        ? 4
        : 0;

    const occNum =
      r.occupation === 'Sinh viên'
        ? 1
        : r.occupation === 'Nhân viên văn phòng'
        ? 2
        : r.occupation === 'Kinh doanh'
        ? 3
        : r.occupation
        ? 4
        : 0;

    const sc1Correct = r.sc1 === '3 sản phẩm' || r.sc1 === '3' ? 1 : 0;
    const sc2Correct = r.sc2 === '53' || r.sc2 === '53 người' ? 1 : 0;
    const sn1Correct =
      r.sn1 === 'Premium Shipping' || r.sn1 === 'Premium Shipping (35.000₫)' ? 1 : 0;

    return {
      participant_id: r.participantUuid,
      group_type: r.groupType,
      group_num: groupNum,
      gender: r.gender || '',
      gender_num: genderNum,
      age_group: r.ageGroup || '',
      age_num: ageNum,
      online_freq: r.onlineShoppingFreq || '',
      online_freq_num: freqNum,
      education: r.education || '',
      education_num: eduNum,
      occupation: r.occupation || '',
      occupation_num: occNum,
      qual1: r.qual1,
      qual2: r.qual2,
      qual3: r.qual3,
      qual4: r.qual4,
      mean_qual: meanQual,
      quan1: r.quan1,
      quan2: r.quan2,
      quan3: r.quan3,
      quan4: r.quan4,
      mean_quan: meanQuan,
      rel1: r.rel1,
      rel2: r.rel2,
      rel3: r.rel3,
      mean_rel: meanRel,
      cla1: r.cla1,
      cla2: r.cla2,
      cla3: r.cla3,
      cla4: r.cla4,
      mean_cla: meanCla,
      pcm1: r.pcm1,
      pcm2: r.pcm2,
      pcm3: r.pcm3,
      pcm4: r.pcm4,
      pcm5: r.pcm5,
      pcm6: r.pcm6,
      mean_pcm: meanPcm,
      att1: r.att1,
      att2: r.att2,
      att3: r.att3,
      att4: r.att4,
      mean_att: meanAtt,
      pi1: r.pi1,
      pi2: r.pi2,
      pi3: r.pi3,
      mean_pi: meanPi,
      loy1: r.loy1,
      loy2: r.loy2,
      loy3: r.loy3,
      mean_loy: meanLoy,
      fam1: r.fam1,
      fam2: r.fam2,
      fam3: r.fam3,
      fam4: r.fam4,
      mean_fam: meanFam,
      ac1: r.ac1 ?? -999,
      sc1: r.sc1 || '',
      sc2: r.sc2 || '',
      sn1: r.sn1 || '',
      sc1_correct: sc1Correct,
      sc2_correct: sc2Correct,
      sn1_correct: sn1Correct,
      product_page_sec: r.productPageDuration,
      cart_page_sec: r.cartPageDuration,
      survey_sec: r.surveyDuration,
      total_sec: r.totalDuration,
      is_speeding: r.isSpeeding ? 1 : 0,
      failed_manipulation: r.failedManipulation ? 1 : 0,
      failed_attention: r.failedAttention ? 1 : 0,
      started_at: r.startedAt.toISOString(),
      submitted_at: r.submittedAt.toISOString(),
    };
  });
}

export function generateCsvString(records: FlatRecord[]): string {
  if (records.length === 0) {
    return 'participant_id,group_type,group_num\n';
  }

  const headers = Object.keys(records[0]) as (keyof FlatRecord)[];
  const csvLines: string[] = [headers.join(',')];

  for (const record of records) {
    const row = headers.map((key) => {
      const val = record[key];
      if (typeof val === 'string') {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvLines.push(row.join(','));
  }

  return csvLines.join('\n');
}

export function generateXlsxBuffer(records: FlatRecord[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SEM_Data');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function generateSpssSyntax(): string {
  return `* =========================================================.
* SPSS SYNTAX FOR: Witte et al. (2025) Replication Study.
* Dark Patterns in Online Retailing: Information Manipulation Theory.
* =========================================================.

VARIABLE LABELS
  participant_id 'Participant Unique Identifier'
  group_type 'Experimental Condition (String)'
  group_num 'Experimental Condition (Numeric)'
  gender 'Gender (String)'
  gender_num 'Gender: 1=Nam, 2=Nu, 3=Khac'
  age_group 'Age Group (String)'
  age_num 'Age: 1=18-22, 2=23-30, 3=31-40, 4=41+'
  online_freq 'Online Shopping Frequency (String)'
  online_freq_num 'Online Freq: 1=<1/thang, 2=1-3, 3=4-10, 4=>10'
  education 'Education Level (String)'
  education_num 'Education: 1=Cao dang, 2=Dai hoc, 3=Sau dai hoc, 4=Khac'
  occupation 'Occupation (String)'
  occupation_num 'Occupation: 1=Sinh vien, 2=Van phong, 3=Kinh doanh, 4=Khac'
  qual1 'QUAL1: False (1) - True (7)'
  qual2 'QUAL2: Distorted (1) - Accurate (7)'
  qual3 'QUAL3: Fabricated (1) - Genuine (7)'
  qual4 'QUAL4: Altered (1) - Authentic (7)'
  quan1 'QUAN1: Uninformative (1) - Informative (7)'
  quan2 'QUAN2: Incomplete (1) - Complete (7)'
  quan3 'QUAN3: Concealing (1) - Revealing (7)'
  quan4 'QUAN4: Non-disclosive (1) - Disclosive (7)'
  rel1 'REL1: Irrelevant (1) - Relevant (7)'
  rel2 'REL2: Inapplicable (1) - Applicable (7)'
  rel3 'REL3: Impertinent (1) - Pertinent (7)'
  cla1 'CLA1: Ambiguous (1) - Clear (7)'
  cla2 'CLA2: Obscure (1) - Straightforward (7)'
  cla3 'CLA3: Vague (1) - Precise (7)'
  cla4 'CLA4: Indefinite (1) - Definite (7)'
  pcm1 'PCM1: Website dang co tac dong den quyet dinh mua'
  pcm2 'PCM2: Website dang han che kha nang tu do lua chon'
  pcm3 'PCM3: Quyen tu chu quyet dinh bi giam'
  pcm4 'PCM4: Website dang thao tung hanh vi mua sam'
  pcm5 'PCM5: Website uu tien loi ich cua minh hon khach hang'
  pcm6 'PCM6: Bi lua hoac danh lac huong khi mua hang'
  att1 'ATT1: Negative (1) - Positive (7)'
  att2 'ATT2: Bad (1) - Good (7)'
  att3 'ATT3: Dislike (1) - Like (7)'
  att4 'ATT4: Unfavorable (1) - Favorable (7)'
  pi1 'PI1: I would consider buying this product'
  pi2 'PI2: I intend to buy this product'
  pi3 'PI3: Likelihood of purchasing is high'
  loy1 'LOY1: I would revisit this website'
  loy2 'LOY2: I would purchase from website again'
  loy3 'LOY3: I would recommend website to others'
  fam1 'FAM1: I frequently shop online'
  fam2 'FAM2: Extensive online shopping experience'
  fam3 'FAM3: Familiar with e-commerce sites'
  fam4 'FAM4: Understand how e-commerce works'
  ac1 'AC1: Attention Check (Select 6)'
  sc1_correct 'Manipulation Check: Scarcity Items Correct (3)'
  sc2_correct 'Manipulation Check: Scarcity Viewers Correct (53)'
  sn1_correct 'Manipulation Check: Sneaking Fee Correct (Premium Shipping)'
  is_speeding 'Flag: Survey duration < 60s (Speeder)'
  failed_manipulation 'Flag: Failed manipulation check'
  failed_attention 'Flag: Failed attention check (AC1 /= 6)'.

VALUE LABELS
  group_num
    1 'CONTROL'
    2 'SCARCITY'
    3 'SNEAKING'
    4 'BOTH'
  /gender_num
    1 'Nam'
    2 'Nữ'
    3 'Khác'
  /age_num
    1 '18-22'
    2 '23-30'
    3 '31-40'
    4 '41+'
  /online_freq_num
    1 'Dưới 1 lần/tháng'
    2 '1-3 lần/tháng'
    3 '4-10 lần/tháng'
    4 'Trên 10 lần/tháng'
  /education_num
    1 'Cao đẳng'
    2 'Đại học'
    3 'Sau đại học'
    4 'Khác'
  /occupation_num
    1 'Sinh viên'
    2 'Nhân viên văn phòng'
    3 'Kinh doanh'
    4 'Khác'
  /qual1 TO fam4 ac1
    1 '1 (Cực trái / Hoàn toàn không đồng ý)'
    2 '2'
    3 '3'
    4 '4 (Trung lập)'
    5 '5'
    6 '6'
    7 '7 (Cực phải / Hoàn toàn đồng ý)'
  /is_speeding failed_manipulation failed_attention sc1_correct sc2_correct sn1_correct
    0 'No / Passed / Incorrect'
    1 'Yes / Failed / Correct'.

MISSING VALUES sc1_num sc2_num sn1_num (-999).

* COMPUTE LATENT CONSTRUCT MEANS.
COMPUTE QUALITY = MEAN(qual1, qual2, qual3, qual4).
COMPUTE QUANTITY = MEAN(quan1, quan2, quan3, quan4).
COMPUTE RELEVANCE = MEAN(rel1, rel2, rel3).
COMPUTE CLARITY = MEAN(cla1, cla2, cla3, cla4).
COMPUTE PCM = MEAN(pcm1, pcm2, pcm3, pcm4, pcm5, pcm6).
COMPUTE ATTITUDE = MEAN(att1, att2, att3, att4).
COMPUTE PURCHASE_INT = MEAN(pi1, pi2, pi3).
COMPUTE LOYALTY = MEAN(loy1, loy2, loy3).
COMPUTE FAMILIARITY = MEAN(fam1, fam2, fam3, fam4).
EXECUTE.

* RELIABILITY ANALYSIS (CRONBACH ALPHA).
RELIABILITY /VARIABLES=qual1 qual2 qual3 qual4 /SCALE('Quality') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=quan1 quan2 quan3 quan4 /SCALE('Quantity') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=rel1 rel2 rel3 /SCALE('Relevance') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=cla1 cla2 cla3 cla4 /SCALE('Clarity') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=pcm1 pcm2 pcm3 pcm4 pcm5 pcm6 /SCALE('PCM') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=att1 att2 att3 att4 /SCALE('Attitude') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=pi1 pi2 pi3 /SCALE('Purchase Intention') ALL /MODEL=ALPHA.
RELIABILITY /VARIABLES=loy1 loy2 loy3 /SCALE('Loyalty Intention') ALL /MODEL=ALPHA.

* ANOVA ACROSS EXPERIMENTAL CONDITIONS (Clean dataset: exclude speeders, failed attention, failed manipulation).
FILTER OFF.
USE ALL.
SELECT IF (is_speeding = 0 AND failed_manipulation = 0 AND failed_attention = 0).
EXECUTE.

ONEWAY QUALITY QUANTITY RELEVANCE CLARITY PCM ATTITUDE PURCHASE_INT LOYALTY BY group_num
  /STATISTICS DESCRIPTIVES HOMOGENEITY
  /POSTHOC=TUKEY BONFERRONI ALPHA(0.05).
`;
}

export function generateRScript(): string {
  return `# =========================================================
# R lavaan SEM Script: Witte et al. (2025) Replication
# Dark Patterns in Online Retailing: Information Manipulation Theory
# =========================================================

# Install packages if needed:
# install.packages(c("lavaan", "semPlot", "tidyverse", "psych"))

library(tidyverse)
library(lavaan)
library(semPlot)
library(psych)

# 1. Load dataset (flat-table export)
data <- read.csv("imt_dark_patterns_data.csv", stringsAsFactors = FALSE)

# 2. Quality Filter: Remove speeders and failed manipulation checks
clean_data <- data %>%
  filter(is_speeding == 0, failed_manipulation == 0)

cat(sprintf("Total raw sample: %d | Clean sample for SEM: %d\\n", nrow(data), nrow(clean_data)))

# 3. Descriptive Statistics & Cronbach's Alpha
alpha(clean_data[, c("qual1", "qual2", "qual3", "qual4")])
alpha(clean_data[, c("quan1", "quan2", "quan3", "quan4")])
alpha(clean_data[, c("rel1", "rel2", "rel3")])
alpha(clean_data[, c("cla1", "cla2", "cla3", "cla4")])
alpha(clean_data[, c("pcm1", "pcm2", "pcm3", "pcm4", "pcm5", "pcm6")])
alpha(clean_data[, c("att1", "att2", "att3", "att4")])
alpha(clean_data[, c("pi1", "pi2", "pi3")])
alpha(clean_data[, c("loy1", "loy2", "loy3")])

# 4. Specification of SEM Model
# Information Manipulation Theory dimensions -> Perceived Customer Manipulation -> Attitude -> Outcomes
sem_model <- '
  # Measurement Model (CFA)
  QUAL =~ qual1 + qual2 + qual3 + qual4
  QUAN =~ quan1 + quan2 + quan3 + quan4
  REL  =~ rel1 + rel2 + rel3
  CLA  =~ cla1 + cla2 + cla3 + cla4
  PCM  =~ pcm1 + pcm2 + pcm3 + pcm4 + pcm5 + pcm6
  ATT  =~ att1 + att2 + att3 + att4
  PI   =~ pi1 + pi2 + pi3
  LOY  =~ loy1 + loy2 + loy3

  # Structural Regressions
  # Dark pattern violations affect PCM
  PCM ~ a1*QUAL + a2*QUAN + a3*REL + a4*CLA + fam1

  # PCM damages Attitude Toward Website
  ATT ~ b1*PCM + fam1

  # Attitude drives Purchase Intention and Loyalty
  PI  ~ c1*ATT + c2*PCM
  LOY ~ d1*ATT + d2*PI
'

# 5. Fit Structural Equation Model
fit <- sem(sem_model, data = clean_data, estimator = "MLR")

# 6. Model Results & Fit Indices
summary(fit, fit.measures = TRUE, standardized = TRUE, rsquare = TRUE)

# Inspect key SEM Fit Indices: CFI >= .90, TLI >= .90, RMSEA <= .08, SRMR <= .08
fitMeasures(fit, c("chisq.scaled", "df.scaled", "pvalue.scaled", "cfi.robust", "tli.robust", "rmsea.robust", "srmr"))

# 7. Path Diagram Plot
semPaths(fit, what = "std", edge.label.cex = 0.8, layout = "tree", fade = FALSE)
`;
}

export function generatePythonScript(): string {
  return `# =========================================================
# Python semopy Script: Witte et al. (2025) Replication
# Dark Patterns in Online Retailing: Information Manipulation Theory
# =========================================================

# Install: pip install semopy pandas numpy statsmodels matplotlib

import pandas as pd
import numpy as np
from semopy import Model, report

# 1. Load exported flat CSV dataset
df = pd.read_csv("imt_dark_patterns_data.csv")

# 2. Filter out speeders and manipulation check failures
clean_df = df[(df['is_speeding'] == 0) & (df['failed_manipulation'] == 0)].copy()
print(f"Total responses: {len(df)}, Quality-checked sample for SEM: {len(clean_df)}")

# 3. Define SEM Model description syntax for semopy
model_desc = """
# Measurement Model
QUAL =~ qual1 + qual2 + qual3 + qual4
QUAN =~ quan1 + quan2 + quan3 + quan4
REL =~ rel1 + rel2 + rel3
CLA =~ cla1 + cla2 + cla3 + cla4
PCM =~ pcm1 + pcm2 + pcm3 + pcm4 + pcm5 + pcm6
ATT =~ att1 + att2 + att3 + att4
PI =~ pi1 + pi2 + pi3
LOY =~ loy1 + loy2 + loy3

# Structural Paths
PCM ~ QUAL + QUAN + REL + CLA
ATT ~ PCM
PI ~ ATT + PCM
LOY ~ ATT + PI
"""

# 4. Fit the Model
model = Model(model_desc)
results = model.fit(clean_df)

# 5. Inspect Estimates
estimates = model.inspect()
print("\\n--- SEM PARAMETER ESTIMATES ---")
print(estimates)

# 6. Fit Statistics
from semopy import calc_stats
stats = calc_stats(model)
print("\\n--- FIT INDICES ---")
print(stats.T)

# 7. Generate Full Academic HTML Report
report(model, "sem_academic_report")
print("SEM Report generated in sem_academic_report/ directory.")
`;
}
