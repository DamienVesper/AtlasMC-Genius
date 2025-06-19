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

import { Guild } from "./Guild.js";
import { User } from "./User.js";

/**
 * This exists as a separate table rather than being
 * columns of the User table itself as it is much more prone
 * to being randomly updated, and therefore decoupling them
 * reduces the risk of accidentally deleting all the data.
 *
 * A bandage solution when the real problem is developer
 * skill issue, but whatever.
 */
export const Cooldowns = pgTable("cooldowns", t => ({
    id: t.serial().primaryKey(),
    discordId: t.text().notNull().references(() => User.discordId),
    guildId: t.text().notNull().references(() => Guild.discordId),
    xp: t.timestamp({ withTimezone: true }).notNull().default(new Date(0))
}));

// export const cooldownRelations = relations(Cooldowns, ({ one }) => ({
//     user: one(User, {
//         fields: [Cooldowns.discordId],
//         references: [User.discordId]
//     }),
//     guild: one(Guild, {
//         fields: [Cooldowns.guildId],
//         references: [Guild.discordId]
//     })
// }));
