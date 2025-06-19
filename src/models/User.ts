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
import { pgTable } from "drizzle-orm/pg-core";

// import { Case } from "./Case.js";
import { Guild } from "./Guild.js";
// import { Cooldowns } from "./Cooldowns.js";

export const User = pgTable("user", t => ({
    id: t.serial().primaryKey(),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    discordId: t.text().notNull(),
    guildId: t.text().notNull().references(() => Guild.discordId),
    xp: t.integer().notNull().default(0),
    level: t.integer().notNull().default(0),
    balance: t.numeric().notNull().default("0.00"),
    xpBanned: t.boolean().notNull().default(false)
}));

// export const userRelations = relations(User, ({ one, many }) => ({
//     guild: one(Guild, {
//         fields: [User.guildId],
//         references: [Guild.discordId]
//     }),
//     cooldowns: one(Cooldowns, {
//         fields: [User.discordId, User.guildId],
//         references: [Cooldowns.discordId, Cooldowns.guildId]
//     }),
//     cases: many(Case)
// }));
