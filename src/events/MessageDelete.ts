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

import { EmbedBuilder, Events } from "discord.js";

import { Event } from "../classes/Event.js";

import { cleanse } from "../utils/utils.js";

const EventType = Events.MessageDelete;

class MessageDelete extends Event<typeof EventType> {
    constructor (client: Event<typeof EventType>["client"]) {
        super(client);

        this.config = {
            name: EventType,
            once: false
        };

        this.run = async message => {
            if (!this.client.config.modules.logging.enabled) return;

            if (message.partial) message = await message.fetch(true);
            if (!message.inGuild()) return;

            const logEmbed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription([
                    `**Message sent by <@${message.author.id}> deleted in <#${message.channel.id}>.**`,
                    `[Jump to Message](${message.url})`,
                    "",
                    "### Content",
                    `\`\`\`${cleanse(message.content)}\`\`\``
                ].join("\n"))
                .setTimestamp()
                .setFooter({ text: `ID: ${message.author.id}` });

            const logChannel = await message.guild.channels.fetch(this.client.config.modules.logging.channels.modLog);
            if (logChannel?.isSendable()) await logChannel.send({ embeds: [logEmbed], files: message.attachments.map(x => x) });
        };
    }
}

export default MessageDelete;
