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
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    InteractionContextType,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

class Rules extends Command {
    cmd = new SlashCommandBuilder()
        .setName("rules")
        .setDescription("View server rules.")
        .setContexts(InteractionContextType.Guild);

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) return;

        const sEmbed = new EmbedBuilder()
            .setColor(this.client.config.colors.orange)
            .setDescription("View the game rules [here](https://docs.google.com/document/d/1UeloAWA7u0tgztSRv6sLqNxQamF-nLVWW_MNpphFSCo/edit?usp=sharing).")
            .setThumbnail(interaction.guild.iconURL() ?? null)
            .setImage("https://i.kym-cdn.com/entries/icons/original/000/033/153/therules.jpg")
            .setTimestamp()
            .setFooter({ text: `ID: ${interaction.user.id}` });

        if (interaction.guild.rulesChannelId != null) {
            const sRow = new ActionRowBuilder<ButtonBuilder>();
            sRow.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Server Rules").setURL(`https://discord.com/channels/${interaction.guildId}/${interaction.guild.rulesChannelId}`));
            sRow.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Game Rules").setURL(`https://${this.client.config.customData.domain}/rules/`));

            await interaction.reply({ embeds: [sEmbed], components: [sRow] });
        } else await interaction.reply({ embeds: [sEmbed] });
    };
}

export default Rules;
