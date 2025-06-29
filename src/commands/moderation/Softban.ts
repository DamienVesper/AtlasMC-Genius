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
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";
import { count, eq } from "drizzle-orm";

import { Command } from "../../classes/Command.js";
import { Case, CaseAction } from "../../models/Case.js";

class Softban extends Command {
    cmd = new SlashCommandBuilder()
        .setName("softban")
        .setDescription("Softban a user.")
        .addUserOption(option => option.setName("user").setDescription("The user to ban.").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("The reason you are softbanning the user."))
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

        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const target = await interaction.guild.members.fetch(user.id);

        if (!target) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "That user is not in the server.")], flags: MessageFlags.Ephemeral });
            return;
        } else if (!target.bannable || target.id === this.client.user.id) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "I cannot ban that user.")], flags: MessageFlags.Ephemeral });
            return;
        } else if (target.roles.highest.comparePositionTo(member.roles.highest) >= 0) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "You do not outrank that user.")], flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const caseCount = (await this.client.db.select({ count: count() }).from(Case).where(eq(Case.guildId, interaction.guildId)))[0].count;
        const modCase = (await this.client.db.insert(Case).values({
            id: caseCount + 1,
            targetId: target.id,
            issuerId: interaction.user.id,
            guildId: interaction.guildId,
            reason,
            action: CaseAction.Softban
        } satisfies typeof Case.$inferInsert).returning())[0];

        const msg = await target.send({ embeds: [this.client.createDMCaseEmbed(modCase.id, CaseAction.Softban, interaction.guild, interaction.user, reason)] });
        await target.ban({ reason: `${reason} - ${interaction.user.username}`, deleteMessageSeconds: 604800 })
            .then(async () => {
                if (this.client.config.modules.logging.enabled) {
                    const logChannel = await interaction.guild.channels.fetch(this.client.config.modules.logging.channels.modLog);
                    const punishmentChannel = await interaction.guild.channels.fetch(this.client.config.modules.logging.channels.punishmentLog);

                    if (logChannel?.isSendable()) await logChannel.send({ embeds: [this.client.createLogEmbed(modCase.id, CaseAction.Softban, interaction.user, target.user, reason)] });
                    if (punishmentChannel?.isSendable()) await punishmentChannel.send({ embeds: [this.client.createCaseEmbed(modCase.id, CaseAction.Softban, interaction.user, target.user, reason)] });
                }

                await interaction.guild.members.unban(target.id, `Softban | Case #${modCase.id}`)
                    .then(async () => {
                        await interaction.followUp({ embeds: [this.client.createReplyCaseEmbed(modCase.id, CaseAction.Softban, target.user)] });
                    }).catch(err => {
                        console.error(err);
                        void interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "I could not unban that user.")] });
                    });
            }).catch(async err => {
                this.client.logger.warn("Gateway", `Failed to ban: ${err}`);
                await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "There was an error while banning that user.")] });
                await msg.delete();
            });
    };
}

export default Softban;
