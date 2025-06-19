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

import {
    EmbedBuilder,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

import { numToCooldownFormat } from "../../utils/utils.js";

class Ping extends Command {
    cmd = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("View ping statistics.");

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        const sEmbed = new EmbedBuilder()
            .setColor(this.client.config.colors.orange)
            .setDescription([
                "### Bot Statistics",
                `${this.client.config.emojis.network} **Latency:** \`${this.client.ws.ping} ms\``,
                `⏰ **Uptime:** \`${numToCooldownFormat(this.client.uptime)}\``,
                `${this.client.config.emojis.memory} **Memory:** \`${Math.trunc(process.memoryUsage().rss / (1024 ** 2))} MiB\``
            ].join("\n"))
            .setThumbnail(interaction.guild?.iconURL() ?? null)
            .setTimestamp()
            .setFooter({ text: `ID: ${interaction.user.id}` });

        await interaction.reply({ embeds: [sEmbed] });
    };
}

export default Ping;
