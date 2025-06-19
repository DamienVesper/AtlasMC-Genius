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

class Embed extends Command {
    cmd = new SlashCommandBuilder()
        .setName("embed")
        .addStringOption(option => option.setName("description").setDescription("The description of the embed.").setRequired(true))
        .addStringOption(option => option.setName("author").setDescription("The author of the embed."))
        .addStringOption(option => option.setName("title").setDescription("The title of the embed."))
        .addStringOption(option => option.setName("color").setDescription("Optional color of the embed."))
        .addStringOption(option => option.setName("footer").setDescription("Optional footer text for the embed."))
        .setDescription("Make an embed.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild);

    config = {
        botPermissions: [
            PermissionFlagsBits.EmbedLinks
        ],
        userPermissions: [
            PermissionFlagsBits.Administrator
        ],
        cooldown: 0
    };

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inGuild() || !interaction.channel?.isTextBased()) return;

        const author = interaction.options.getString("author");
        const title = interaction.options.getString("title");
        const desc = interaction.options.getString("description", true);

        const color = interaction.options.getString("color");
        const footer = interaction.options.getString("footer");

        const sEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setTimestamp();

        if (author !== null) sEmbed.setAuthor({ name: author });
        if (color !== null) {
            const col = Number(color);
            if (isNaN(col)) {
                await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "That is an invalid color! Colors should be specified as `0xRRGGBB`.")], flags: MessageFlags.Ephemeral });
                return;
            }

            sEmbed.setColor(Number(color));
        }
        if (footer !== null) sEmbed.setFooter({ text: footer });

        await interaction.reply({ embeds: [this.client.createApproveEmbed(interaction.user, "Your embed was created.")], flags: MessageFlags.Ephemeral });

        /**
         * Send an embed.
         */
        await interaction.channel.send({ embeds: [sEmbed] }).then(async () => {
            await Bun.sleep(3e3);
            await interaction.deleteReply();
        }).catch(err => {
            this.client.logger.warn("Gateway", `Failed to send message: ${err}`);
        });
    };
}

export default Embed;
