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
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type GuildMember
} from "discord.js";

import { Command } from "../../classes/Command.js";

import { fetchLeaderboard, LBUser } from "../../utils/db.js";
import { cleanse } from "../../utils/utils.js";

class Leaderboard extends Command {
    cmd = new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the server leaderboard.")
        .setContexts(InteractionContextType.Guild);

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: "This command can only be used in a guild!", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const lbUsers = await fetchLeaderboard(this.client, interaction.guildId);
        if (lbUsers === null) {
            await interaction.followUp({ content: "The leaderboard is currently updating. Please try again later.", flags: MessageFlags.Ephemeral });
            return;
        } else if (lbUsers.length === 0) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "There are no users in the leaderboard!")] });
            return;
        }

        const members: Array<{ user: LBUser, member: GuildMember }> = [];
        for (let i = 0; i < Math.min(lbUsers.length, 10); i++) {
            const member = await interaction.guild.members.fetch(lbUsers[i].discordId);
            if (member === null) continue;

            members.push({ user: lbUsers[i], member });
        }

        const lbTxt = [];
        for (let i = 0; i < members.length; i++)
            lbTxt.push(`${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"} **${cleanse(members[i].member.nickname ?? members[i].member.displayName)}** - Level ${members[i].user.level}`);

        const userPos = lbUsers.findIndex(x => x.discordId === interaction.user.id);
        if (userPos > 9) {
            const user = lbUsers[userPos];
            if (user) {
                lbTxt.push(
                    "---",
                    `#${userPos} - **${cleanse(interaction.member.nickname ?? interaction.user.displayName)}** - Level ${user.level}`
                );
            }
        }

        const sEmbed = new EmbedBuilder()
            .setColor(this.client.config.colors.blue)
            .setAuthor({ name: "Server Leaderboard", iconURL: interaction.guild.iconURL() ?? undefined })
            .setDescription(lbTxt.join("\n"))
            .setTimestamp()
            .setFooter({ text: `ID: ${interaction.user.id}` });

        await interaction.followUp({ embeds: [sEmbed] });
    };
}

export default Leaderboard;
