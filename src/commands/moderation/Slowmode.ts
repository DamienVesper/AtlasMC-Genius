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
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";
import { cleanse, numToCooldownFormat } from "../../utils/utils.js";

class Slowmode extends Command {
    cmd = new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Set a slowmode on the channel.")
        .addIntegerOption(option => option.setName("duration").setDescription("The ratelimit duration, in seconds, per user per message.").setMinValue(1).setMaxValue(100).setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("The reason you are modifying channel slowmode."))
        .setContexts(InteractionContextType.Guild);

    config = {
        botPermissions: [],
        userPermissions: [],
        cooldown: 0
    };

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        /**
         * There is probably some type guard that I missed that will guarantee setRateLimitPerUser.
         */
        if (!interaction.inCachedGuild() || (
            interaction.channel?.type !== ChannelType.GuildText
            && interaction.channel?.type !== ChannelType.GuildVoice
        )) return;

        /**
         * Allows for granular permissions on channels / categories themselves, rather than global (guild) permissions.
         */
        if (!interaction.channel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "You are missing the `ManageChannels` permission to execute this command.")], flags: MessageFlags.Ephemeral });
            return;
        }

        if (!interaction.channel.permissionsFor(interaction.guild.members.me!).has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "I am missing the `ManageChannels` permission to execute this command.")], flags: MessageFlags.Ephemeral });
            return;
        }

        const duration = interaction.options.getInteger("duration", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";

        await interaction.deferReply();
        await interaction.channel.setRateLimitPerUser(duration, `${reason} - ${interaction.user.username}`)
            .then(async () => {
                await interaction.followUp({ embeds: [this.client.createApproveEmbed(interaction.user, `**Set slowmode to ${duration} seconds.**`)] });

                if (this.client.config.modules.logging.enabled) {
                    const logChannel = await interaction.guild.channels.fetch(this.client.config.modules.logging.channels.modLog);

                    if (logChannel?.isSendable()) {
                        const logEmbed = new EmbedBuilder()
                            .setAuthor({ name: "Slowmode Changed" })
                            .setDescription([
                                "### Channel",
                                `<#${interaction.channelId}`,
                                "### Duration",
                                numToCooldownFormat(duration),
                                "### Responsible Moderator",
                                `<@${interaction.user.id}>`,
                                "### Reason",
                                `\`\`\`${cleanse(reason)}\`\`\``
                            ].join("\n"))
                            .setTimestamp()
                            .setFooter({ text: `ID: ${interaction.channelId}` });

                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            }).catch(async err => {
                this.client.logger.warn("Gateway", `Failed to modify channel slowmode: ${err}`);
                await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "There was an error while updating the channel's slowmode.")] });
            });
    };
}

export default Slowmode;
