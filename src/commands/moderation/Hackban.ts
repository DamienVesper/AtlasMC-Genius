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
import { count, eq } from "drizzle-orm";

import { Command } from "../../classes/Command.js";
import { Case, CaseAction } from "../../models/Case.js";
import { cleanse } from "../../utils/utils.js";

class Hackban extends Command {
    cmd = new SlashCommandBuilder()
        .setName("hackban")
        .setDescription("Hackban a user.")
        .addStringOption(option => option.setName("id").setDescription("The ID of user to ban.").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("The reason you are banning the user."))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setContexts(InteractionContextType.Guild);

    config = {
        botPermissions: [
            PermissionFlagsBits.BanMembers
        ],
        userPermissions: [
            PermissionFlagsBits.BanMembers
        ],
        cooldown: 0
    };

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) return;

        const targetId = interaction.options.getString("id", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";

        const target = await interaction.guild.members.fetch(targetId);

        if (target !== null) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "Hackban only works on users who are not in the server.\nPlease use `/ban` to ban users in the server.")], flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const caseCount = (await this.client.db.select({ count: count() }).from(Case).where(eq(Case.guildId, interaction.guildId)))[0].count;
        const modCase = (await this.client.db.insert(Case).values({
            id: caseCount + 1,
            targetId: targetId,
            issuerId: interaction.user.id,
            guildId: interaction.guildId,
            reason,
            action: CaseAction.Hackban
        } satisfies typeof Case.$inferInsert).returning())[0];

        await interaction.guild.members.ban(targetId, { reason: `${reason} - ${interaction.user.username}` })
            .then(async () => {
                const replyEmbed = this.client.createEmbed(targetId, `${this.client.config.emojis.checkmark} **${targetId} was banned.`)
                    .setColor(this.client.config.colors.green);

                await interaction.followUp({ embeds: [replyEmbed] });

                if (this.client.config.modules.logging.enabled) {
                    const logChannel = await interaction.guild.channels.fetch(this.client.config.modules.logging.channels.modLog);
                    const punishmentChannel = await interaction.guild.channels.fetch(this.client.config.modules.logging.channels.punishmentLog);

                    if (logChannel?.isSendable()) {
                        const logEmbed = new EmbedBuilder()
                            .setAuthor({ name: targetId })
                            .setDescription([
                                `**\`${targetId}\` (<@${targetId}>) was hackbanned.**`,
                                "",
                                "### Responsible Moderator",
                                `<@${interaction.user.id}>`,
                                "",
                                "### Reason",
                                `\`\`\`${cleanse(reason)}\`\`\``
                            ].join("\n"))
                            .setTimestamp()
                            .setFooter({ text: `ID: ${targetId} | Case #${modCase.id}` });

                        await logChannel.send({ embeds: [logEmbed] });
                    }

                    if (punishmentChannel?.isSendable()) {
                        const caseEmbed = new EmbedBuilder()
                            .setColor(this.client.config.colors.orange)
                            .setAuthor({ name: `Hackban | Case #${modCase.id}` })
                            .addFields([
                                {
                                    name: "User",
                                    value: `\`${targetId}\` (<@${targetId}>)`
                                },
                                {
                                    name: "Moderator",
                                    value: `${cleanse(interaction.user.displayName)} (<@${interaction.user.id}>)`
                                },
                                {
                                    name: "Reason",
                                    value: reason
                                }
                            ])
                            .setTimestamp()
                            .setFooter({ text: `ID: ${targetId}` });
                        await punishmentChannel.send({ embeds: [caseEmbed] });
                    }
                }
            }).catch(async err => {
                this.client.logger.warn("Gateway", `Failed to hackban: ${err}`);
                await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "There was an error while banning that user.")] });
            });
    };
}

export default Hackban;
