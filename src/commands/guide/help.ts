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
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

import { Paginator } from "../../modules/Paginator.js";

import { capitalize, createUsageExample } from "../../utils/utils.js";

class Help extends Command {
    cmd = new SlashCommandBuilder()
        .setName("help")
        .setDescription("View the help menu.");

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const commandsByCategory: Record<string, Command[]> = {};
        for (const [, command] of [...this.client.commands]) {
            if (commandsByCategory[command.category] === undefined) commandsByCategory[command.category] = [];
            commandsByCategory[command.category].push(command);
        }

        const embeds = [
            new EmbedBuilder()
                .setColor(this.client.config.colors.purple)
                .setTitle("Help")
                .setDescription(`View help for a specific command. Available categories are:\n${Object.keys(commandsByCategory).map(key => `- **${capitalize(key)}**`).join("\n")}`)
                .setTimestamp()
                .setFooter({ text: `ID: ${interaction.user.id}` })
        ];

        const entries = Object.entries(commandsByCategory).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [category, commands] of entries) {
            embeds.push(new EmbedBuilder()
                .setColor(this.client.config.colors.purple)
                .setTitle(`Help | ${capitalize(category)}`)
                .setDescription(commands.map(command => `\`${createUsageExample(command.cmd)}\` - ${command.cmd.description}`).join("\n"))
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const paginator = new Paginator(this.client, interaction, interaction.user, embeds);
    };
}

export default Help;
