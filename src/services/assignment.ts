import { db } from '../db/index.ts';
import { participants, responses } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export type ExperimentalGroup = 'CONTROL' | 'SCARCITY' | 'SNEAKING' | 'BOTH';

const GROUPS: ExperimentalGroup[] = ['CONTROL', 'SCARCITY', 'SNEAKING', 'BOTH'];

export interface ParticipantSession {
  participantUuid: string;
  groupType: ExperimentalGroup;
  hasSubmitted: boolean;
  createdAt: Date;
}

export async function getOrAssignParticipant(clientUuid?: string): Promise<ParticipantSession> {
  try {
    // 1. If client provided UUID, check if existing
    if (clientUuid) {
      const existing = await db
        .select()
        .from(participants)
        .where(eq(participants.participantUuid, clientUuid))
        .limit(1);

      if (existing.length > 0) {
        const participant = existing[0];
        
        // Check if response already submitted
        const responseRecord = await db
          .select({ responseId: responses.responseId })
          .from(responses)
          .where(eq(responses.participantUuid, participant.participantUuid))
          .limit(1);

        return {
          participantUuid: participant.participantUuid,
          groupType: participant.groupType as ExperimentalGroup,
          hasSubmitted: responseRecord.length > 0,
          createdAt: participant.createdAt,
        };
      }
    }

    // 2. Balanced Assignment Algorithm
    // Count current participants in each group
    const countsResult = await db
      .select({
        groupType: participants.groupType,
        count: sql<number>`count(*)::int`,
      })
      .from(participants)
      .groupBy(participants.groupType);

    const countsMap: Record<ExperimentalGroup, number> = {
      CONTROL: 0,
      SCARCITY: 0,
      SNEAKING: 0,
      BOTH: 0,
    };

    countsResult.forEach((row) => {
      const g = row.groupType as ExperimentalGroup;
      if (countsMap[g] !== undefined) {
        countsMap[g] = Number(row.count) || 0;
      }
    });

    // Find the minimum count among the 4 groups
    const minCount = Math.min(...Object.values(countsMap));

    // Get all groups that share this lowest count
    const candidateGroups = GROUPS.filter((g) => countsMap[g] === minCount);

    // If multiple groups have equal counts, randomly pick among them
    const randomIndex = Math.floor(Math.random() * candidateGroups.length);
    const assignedGroup = candidateGroups[randomIndex];

    // Generate UUID v4
    const newUuid = clientUuid && isValidUuid(clientUuid) ? clientUuid : crypto.randomUUID();

    // Insert new participant immediately
    await db.insert(participants).values({
      participantUuid: newUuid,
      groupType: assignedGroup,
      createdAt: new Date(),
    });

    return {
      participantUuid: newUuid,
      groupType: assignedGroup,
      hasSubmitted: false,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error in getOrAssignParticipant:', error);
    throw new Error('Failed to assign participant to experimental condition', { cause: error });
  }
}

function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
