import { db } from '../db/index.ts';
import { participants, responses } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface SurveySubmissionPayload {
  participantUuid: string;
  // Demographics
  gender?: string | null;
  ageGroup?: string | null;
  onlineShoppingFreq?: string | null;
  education?: string | null;
  occupation?: string | null;

  // Construct Items (1-7 Semantic / Likert)
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

  // Attention Check (AC1)
  ac1?: number | null;

  // Manipulation Checks (Concrete options)
  sc1?: string | null;
  sc2?: string | null;
  sn1?: string | null;

  // Timings (in seconds)
  productPageDuration: number;
  cartPageDuration: number;
  surveyDuration: number;
  totalDuration: number;
  startedAt: string | Date;
}

export async function submitSurveyResponse(data: SurveySubmissionPayload) {
  try {
    // 1. Verify participant exists
    const participantRows = await db
      .select()
      .from(participants)
      .where(eq(participants.participantUuid, data.participantUuid))
      .limit(1);

    if (participantRows.length === 0) {
      throw new Error('Participant not found. Please start from the landing page.');
    }

    const participant = participantRows[0];
    const groupType = participant.groupType;

    // 2. Prevent duplicate submission
    const existingResponse = await db
      .select({ id: responses.responseId })
      .from(responses)
      .where(eq(responses.participantUuid, data.participantUuid))
      .limit(1);

    if (existingResponse.length > 0) {
      return {
        success: true,
        alreadySubmitted: true,
        responseId: existingResponse[0].id,
        groupType,
      };
    }

    // 3. Quality Control: Speeder detection (< 60 seconds)
    const surveySec = Math.round(Number(data.surveyDuration) || 0);
    const isSpeeding = surveySec < 60;

    // 4. Attention Check Validation (AC1 - Correct answer is 6)
    const ac1Val = data.ac1 != null ? Number(data.ac1) : null;
    const failedAttention = ac1Val !== 6;

    // 5. Manipulation Check Validation with condition-specific logic:
    // SC1: '3' or '3 sản phẩm'
    // SC2: '53' or '53 người'
    // SN1: 'Premium Shipping' or 'Premium Shipping (35.000₫)'
    let failedManipulation = false;
    const isSc1Correct = data.sc1 === '3' || data.sc1 === '3 sản phẩm';
    const isSc2Correct = data.sc2 === '53' || data.sc2 === '53 người';
    const isSn1Correct =
      data.sn1 === 'Premium Shipping' ||
      data.sn1 === 'Premium Shipping (35.000₫)';

    if (groupType === 'SCARCITY') {
      const pass = isSc1Correct && isSc2Correct;
      if (!pass) failedManipulation = true;
    } else if (groupType === 'SNEAKING') {
      const pass = isSn1Correct;
      if (!pass) failedManipulation = true;
    } else if (groupType === 'BOTH') {
      const pass = isSc1Correct && isSc2Correct && isSn1Correct;
      if (!pass) failedManipulation = true;
    } else {
      // Control group did not have dark patterns
      failedManipulation = false;
    }

    // Sanitize values (ensure 1-7 range)
    const clamp = (val: number) => Math.min(7, Math.max(1, Math.round(Number(val) || 4)));

    // Insert response into PostgreSQL
    const inserted = await db
      .insert(responses)
      .values({
        participantUuid: data.participantUuid,
        groupType,
        gender: data.gender || null,
        ageGroup: data.ageGroup || null,
        onlineShoppingFreq: data.onlineShoppingFreq || null,
        education: data.education || null,
        occupation: data.occupation || null,
        qual1: clamp(data.qual1),
        qual2: clamp(data.qual2),
        qual3: clamp(data.qual3),
        qual4: clamp(data.qual4),
        quan1: clamp(data.quan1),
        quan2: clamp(data.quan2),
        quan3: clamp(data.quan3),
        quan4: clamp(data.quan4),
        rel1: clamp(data.rel1),
        rel2: clamp(data.rel2),
        rel3: clamp(data.rel3),
        cla1: clamp(data.cla1),
        cla2: clamp(data.cla2),
        cla3: clamp(data.cla3),
        cla4: clamp(data.cla4),
        pcm1: clamp(data.pcm1),
        pcm2: clamp(data.pcm2),
        pcm3: clamp(data.pcm3),
        pcm4: clamp(data.pcm4),
        pcm5: clamp(data.pcm5),
        pcm6: clamp(data.pcm6),
        att1: clamp(data.att1),
        att2: clamp(data.att2),
        att3: clamp(data.att3),
        att4: clamp(data.att4),
        pi1: clamp(data.pi1),
        pi2: clamp(data.pi2),
        pi3: clamp(data.pi3),
        loy1: clamp(data.loy1),
        loy2: clamp(data.loy2),
        loy3: clamp(data.loy3),
        fam1: clamp(data.fam1),
        fam2: clamp(data.fam2),
        fam3: clamp(data.fam3),
        fam4: clamp(data.fam4),
        ac1: ac1Val,
        sc1: data.sc1 ?? null,
        sc2: data.sc2 ?? null,
        sn1: data.sn1 ?? null,
        productPageDuration: Math.round(Number(data.productPageDuration) || 0),
        cartPageDuration: Math.round(Number(data.cartPageDuration) || 0),
        surveyDuration: surveySec,
        totalDuration: Math.round(Number(data.totalDuration) || 0),
        isSpeeding,
        failedManipulation,
        failedAttention,
        startedAt: new Date(data.startedAt || Date.now()),
        submittedAt: new Date(),
      })
      .returning({ responseId: responses.responseId });

    return {
      success: true,
      alreadySubmitted: false,
      responseId: inserted[0].responseId,
      groupType,
      isSpeeding,
      failedManipulation,
      failedAttention,
    };
  } catch (error) {
    console.error('Error submitting survey response:', error);
    throw new Error('Failed to record survey response', { cause: error });
  }
}
