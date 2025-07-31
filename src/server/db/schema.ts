import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `better_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  credits: d.integer().notNull().default(1000),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  userBets: many(userBets),
  betsPlaced: many(betsPlaced),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const bets = createTable("bet", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: d.varchar({ length: 32 }).notNull(),
  description: d.varchar({ length: 255 }).notNull(),
  endTime: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  expirationTime: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  createdBy: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: d
    .timestamp({ mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  fee: d.numeric({ precision: 3, scale: 2 }).notNull(),
  lossCap: d.integer().notNull(),
}));

export const userBets = createTable(
  "user_bet",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    betId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => bets.id),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.betId] }),
    index("user_bet_user_idx").on(t.userId),
    index("user_bet_bet_idx").on(t.betId),
  ],
);

export const userBetsRelations = relations(userBets, ({ one }) => ({
  user: one(users, { fields: [userBets.userId], references: [users.id] }),
  bet: one(bets, { fields: [userBets.betId], references: [bets.id] }),
}));

export const betsRelations = relations(bets, ({ many }) => ({
  userBets: many(userBets),
  betOptions: many(betOptions),
  betsPlaced: many(betsPlaced),
}));

export const betStatus = pgEnum("bet_status", ["open", "won", "lost"]);

export const betOptions = createTable("bet_option", (d) => ({
  optionId: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  betId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => bets.id),
  label: d.varchar({ length: 32 }).notNull(),
  status: betStatus().notNull().default("open"),
  currentOdds: d.numeric({ precision: 4, scale: 2 }).notNull(),
}));

export const betOptionsRelations = relations(betOptions, ({ one }) => ({
  bet: one(bets, { fields: [betOptions.betId], references: [bets.id] }),
}));

export const betsPlaced = createTable(
  "bet_placed",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    betId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => bets.id),
    staked: d.integer().notNull(),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.betId] }),
    index("bets_placed_user_idx").on(t.userId),
    index("bets_placed_bet_idx").on(t.betId),
  ],
);

export const betsPlacedRelations = relations(betsPlaced, ({ one }) => ({
  user: one(users, { fields: [betsPlaced.userId], references: [users.id] }),
  bet: one(bets, { fields: [betsPlaced.betId], references: [bets.id] }),
}));
