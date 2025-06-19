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
    ChannelType,
    EmbedBuilder,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

import { cleanse, timestamp } from "../../utils/utils.js";

class ServerInfo extends Command {
    cmd = new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("View server statistics.")
        .setContexts(InteractionContextType.Guild);

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: "This command can only be used in a guild!", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const channels = interaction.guild.channels.cache.filter(channel => channel.type !== ChannelType.GuildCategory);

        const vcChannels = channels.filter(channel => channel.isVoiceBased());
        const textChannels = channels.filter(channel => channel.isTextBased()).filter(channel => !vcChannels.has(channel.id));

        const sEmbed = new EmbedBuilder()
            .setColor(this.client.config.colors.orange)
            .setDescription([
                "### Server Information",
                `${this.client.config.emojis.arrow} **Name:** ${cleanse(interaction.guild.name)}`,
                `${this.client.config.emojis.__.repeat(2)} ID: \`${interaction.guildId}\``,
                `${this.client.config.emojis.owner} **Owner:** <@${interaction.guild.ownerId}>`,
                `🎂 **Created:** ${timestamp(interaction.guild.createdAt)}`,
                `${this.client.config.emojis.arrow}**Channels:** \`${channels.size}\``,
                `${this.client.config.emojis.__.repeat(2)} Text: \`${textChannels.size}\``,
                `${this.client.config.emojis.__.repeat(2)} VC: \`${vcChannels.size}\``,
                `${this.client.config.emojis.member} **Members:** \`${interaction.guild.memberCount}\``,
                `${this.client.config.emojis.bot} Bots: \`${interaction.guild.members.cache.filter(member => member.user.bot).size}\``,
                `${this.client.config.emojis.manager} **Roles:** \`${interaction.guild.roles.cache.size}\``
            ].join("\n"))
            .setThumbnail(interaction.guild.iconURL() ?? null)
            .setTimestamp()
            .setFooter({ text: `ID: ${interaction.user.id}` });

        await interaction.followUp({ embeds: [sEmbed] });
    };
}

export default ServerInfo;
