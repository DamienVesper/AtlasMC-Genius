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

import type { Snowflake } from "discord.js";
import { and, asc, desc, eq } from "drizzle-orm";

import type { DiscordBot } from "../modules/DiscordBot.js";

import { User } from "../models/User.js";
import { Guild } from "../models/Guild.js";

/**
 * Fetch all users in a guild, and return their XP data.
 * @param client The Discord client.
 * @param id The guild ID.
 */
export const getLBUsers = async (client: DiscordBot, id: Snowflake): Promise<LBUser[]> => {
    return (await client.db.select({
        discordId: User.discordId,
        level: User.level,
        xp: User.xp
    }).from(User).where(
        and(
            eq(User.guildId, id),
            eq(User.xpBanned, false)
        )
    ).orderBy(
        desc(User.level),
        desc(User.xp),
        asc(User.discordId)
    ))
        .map(user => ({
            discordId: user.discordId,
            level: user.level,
            xp: user.xp
        }));
};

/**
 * Fetch the server leaderboard for a guild.
 * @param client The Discord client.
 * @param id The guild ID.
 */
export const fetchLeaderboard = async (client: DiscordBot, id: Snowflake): Promise<LBUser[] | null> => {
    if (client.config.modules.caching.enabled) {
        const users = await client.getCacheKey(`${id}/lb`);
        return users === null
            ? users
            : JSON.parse(users) as LBUser[];
    } else return await getLBUsers(client, id);
};

/**
 * Update all guild leaderboards.
 * @param client The Discord client.
 */
export const updateLeaderboards = async (client: DiscordBot): Promise<void> => {
    if (!client.config.modules.caching.enabled) return;

    const guilds = await client.db.select({
        id: Guild.id,
        discordId: Guild.discordId
    }).from(Guild);

    for (const guild of guilds) {
        const users = await getLBUsers(client, guild.discordId);
        await client.setCacheKey(`${guild.id}/lb`, JSON.stringify(users));
    }
};

export type LBUser = Pick<typeof User.$inferSelect, "discordId" | "level" | "xp">;
