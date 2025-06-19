/*
 * Atlas Reunion Discord Bot
 * Copyright (C) 2025 Damien Vesper
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

// import { relations } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";

// import { Guild } from "./Guild.js";
// import { User } from "./User.js";

export enum CaseAction {
    Warn = "warn",
    Unwarn = "unwarn",
    Mute = "mute",
    Unmute = "unmute",
    Kick = "kick",
    Softban = "softban",
    Hackban = "hackban",
    Tempban = "tempban",
    Ban = "ban",
    Unban = "unban"
}

export const CaseActionEnum = pgEnum("caseAction", CaseAction);

export const Case = pgTable("case", t => ({
    sId: t.serial().primaryKey(),
    id: t.integer().notNull(),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp({ withTimezone: true }),
    expiresAt: t.timestamp({ withTimezone: true }),
    targetId: t.text().notNull(),
    issuerId: t.text().notNull(),
    guildId: t.text().notNull(),
    reason: t.text("reason").notNull(),
    action: CaseActionEnum().notNull().$type<CaseAction>(),
    active: t.boolean().notNull().default(true)
}));

// export const caseRelations = relations(Case, ({ one }) => ({
//     guild: one(Guild, {
//         fields: [Case.guildId],
//         references: [Guild.discordId]
//     })
// }));
