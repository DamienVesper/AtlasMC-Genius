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

import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

import { Case } from "./Case.js";
import { Cooldowns } from "./Cooldowns.js";
import { User } from "./User.js";

export const Guild = pgTable("guild", t => ({
    id: t.serial().primaryKey(),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    discordId: t.text().notNull().unique()
}));

export const guildRelations = relations(Guild, ({ many }) => ({
    users: many(User),
    cases: many(Case),
    cooldowns: many(Cooldowns)
}));
