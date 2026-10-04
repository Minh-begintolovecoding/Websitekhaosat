import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('researcher'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const participants = pgTable('participants', {
  participantUuid: text('participant_uuid').primaryKey(),
  groupType: text('group_type').notNull(), // 'CONTROL' | 'SCARCITY' | 'SNEAKING' | 'BOTH'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const responses = pgTable('responses', {
  responseId: serial('response_id').primaryKey(),
  participantUuid: text('participant_uuid')
    .references(() => participants.participantUuid)
    .notNull()
    .unique(),
  groupType: text('group_type').notNull(),

  // Information Quality (QUAL1 - QUAL4)
  qual1: integer('qual1').notNull(),
  qual2: integer('qual2').notNull(),
  qual3: integer('qual3').notNull(),
  qual4: integer('qual4').notNull(),

  // Information Quantity (QUAN1 - QUAN4)
  quan1: integer('quan1').notNull(),
  quan2: integer('quan2').notNull(),
  quan3: integer('quan3').notNull(),
  quan4: integer('quan4').notNull(),

  // Information Relevance (REL1 - REL3)
  rel1: integer('rel1').notNull(),
  rel2: integer('rel2').notNull(),
  rel3: integer('rel3').notNull(),

  // Information Clarity (CLA1 - CLA4)
  cla1: integer('cla1').notNull(),
  cla2: integer('cla2').notNull(),
  cla3: integer('cla3').notNull(),
  cla4: integer('cla4').notNull(),

  // Perceived Customer Manipulation (PCM1 - PCM6)
  pcm1: integer('pcm1').notNull(),
  pcm2: integer('pcm2').notNull(),
  pcm3: integer('pcm3').notNull(),
  pcm4: integer('pcm4').notNull(),
  pcm5: integer('pcm5').notNull(),
  pcm6: integer('pcm6').notNull(),

  // Attitude Toward Website (ATT1 - ATT4)
  att1: integer('att1').notNull(),
  att2: integer('att2').notNull(),
  att3: integer('att3').notNull(),
  att4: integer('att4').notNull(),

  // Purchase Intention (PI1 - PI3)
  pi1: integer('pi1').notNull(),
  pi2: integer('pi2').notNull(),
  pi3: integer('pi3').notNull(),

  // Loyalty Intention (LOY1 - LOY3)
  loy1: integer('loy1').notNull(),
  loy2: integer('loy2').notNull(),
  loy3: integer('loy3').notNull(),

  // Online Shopping Familiarity (FAM1 - FAM4)
  fam1: integer('fam1').notNull(),
  fam2: integer('fam2').notNull(),
  fam3: integer('fam3').notNull(),
  fam4: integer('fam4').notNull(),

  // Manipulation Checks (Yes / No string or null)
  sc1: text('sc1'),
  sc2: text('sc2'),
  sn1: text('sn1'),

  // Behavioral durations (in seconds)
  productPageDuration: integer('product_page_duration').notNull(),
  cartPageDuration: integer('cart_page_duration').notNull(),
  surveyDuration: integer('survey_duration').notNull(),
  totalDuration: integer('total_duration').notNull(),

  // Quality & Validity Flags
  isSpeeding: boolean('is_speeding').notNull().default(false),
  failedManipulation: boolean('failed_manipulation').notNull().default(false),
  failedAttention: boolean('failed_attention').notNull().default(false),

  // Attention Check (AC1 - Correct answer is 6)
  ac1: integer('ac1'),

  // Timestamps
  startedAt: timestamp('started_at').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),

  // Demographics
  gender: text('gender'),
  ageGroup: text('age_group'),
  onlineShoppingFreq: text('online_shopping_freq'),
  education: text('education'),
  occupation: text('occupation'),
});

export const participantsRelations = relations(participants, ({ one }) => ({
  response: one(responses, {
    fields: [participants.participantUuid],
    references: [responses.participantUuid],
  }),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  participant: one(participants, {
    fields: [responses.participantUuid],
    references: [participants.participantUuid],
  }),
}));
