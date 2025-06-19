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

import { AuditLogEvent, EmbedBuilder, Events } from "discord.js";

import { Event } from "../classes/Event.js";

import { cleanse } from "../utils/utils.js";

const EventType = Events.GuildBanAdd;

class GuildBanAdd extends Event<typeof EventType> {
    constructor (client: Event<typeof EventType>["client"]) {
        super(client);

        this.config = {
            name: EventType,
            once: false
        };

        this.run = async ban => {
            if (!this.client.config.modules.logging.enabled) return;

            const log = (await ban.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1
            })).entries.first();

            if (!log?.executorId
                || log.executorId === client.user.id
                || Date.now() - log.createdTimestamp > 5e3
            ) return;

            const executor = await client.users.fetch(log.executorId);
            if (!executor) return;

            const desc = [
                `**<@${ban.user.id}> was banned from the server.**`,
                "",
                "### Responsible Moderator",
                `<@${log.executorId}>`,
                "### ID",
                `\`\`\`${ban.user.id}\`\`\``
            ];

            if (log.reason) {
                desc.push(...[
                    "### Reason",
                    `\`\`\`${cleanse(log.reason)}\`\`\``
                ]);
            }

            const logEmbed = new EmbedBuilder()
                .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() })
                .setDescription(desc.join("\n"))
                .setTimestamp()
                .setFooter({ text: `ID: ${ban.user.id}` });

            const logChannel = await ban.guild.channels.fetch(this.client.config.modules.logging.channels.modLog);
            if (logChannel?.isSendable()) await logChannel.send({ embeds: [logEmbed] });
        };
    }
}

export default GuildBanAdd;
