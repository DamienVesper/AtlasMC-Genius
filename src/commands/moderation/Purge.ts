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
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

class Purge extends Command {
    cmd = new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Purge a channel's messages.")
        .addIntegerOption(option => option.setName("amount").setDescription("The amount of messages to be deleted.").setMinValue(1).setMaxValue(100).setRequired(true))
        .addUserOption(option => option.setName("user").setDescription("The (optional) user to purge messages from."))
        .addStringOption(option => option.setName("reason").setDescription("The reason you are purging the messages."))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setContexts(InteractionContextType.Guild);

    config = {
        botPermissions: [
            PermissionFlagsBits.ManageMessages
        ],
        userPermissions: [
            PermissionFlagsBits.ManageMessages
        ],
        cooldown: 0
    };

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild() || !interaction.channel?.isTextBased()) return;

        const amount = interaction.options.getInteger("amount", true);
        const target = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";

        let messages = await interaction.channel.messages.fetch({ limit: amount });
        if (target) messages = messages.filter(x => x.author.id === target.id);

        if (messages.size === 0) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "There are no messages to delete.")], flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();
        await interaction.channel.bulkDelete?.(messages)
            .then(async () => {
                await interaction.followUp({ embeds: [this.client.createApproveEmbed(interaction.user, `Deleted **${messages.size}** messages.`)] });
                if (this.client.config.modules.logging.enabled) {
                    const logChannel = await interaction.guild.channels.fetch(this.client.config.modules.logging.channels.modLog);
                    if (logChannel?.isSendable()) {
                        const sEmbed = new EmbedBuilder()
                            .setColor(this.client.config.colors.blue)
                            .setDescription([
                                `**<@${interaction.user.id}> purged ${messages.size} messages in <#${interaction.channel!.id}>.`,
                                "",
                                "### Reason",
                                `\`\`\`${reason}\`\`\``
                            ].join("\n"))
                            .setTimestamp()
                            .setFooter({ text: `ID: ${interaction.user.id}` });
                        await logChannel.send({ embeds: [sEmbed] });
                    }
                }
            }).catch(async err => {
                this.client.logger.warn("Gateway", `Failed to delete messages: ${err}`);
                await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "There was an error while bulk deleting messages.")] });
            });

        await Bun.sleep(5e3);
        await interaction.deleteReply();
    };
}

export default Purge;
