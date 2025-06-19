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

import { Command } from "../../classes/Command.js";

class Say extends Command {
    cmd = new SlashCommandBuilder()
        .setName("say")
        .addStringOption(option => option.setName("message").setDescription("The message to say.").setRequired(true))
        .setDescription("Say something.")
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

        const message = interaction.options.getString("message", true);

        await interaction.reply({ embeds: [this.client.createApproveEmbed(interaction.user, "Your message was sent.")], flags: MessageFlags.Ephemeral });

        /**
         * Send a message while disabling all mentions in the message.
         * People abuse this too frequently, so they will have to live with it.
         */
        await interaction.channel.send({
            content: message,
            allowedMentions: {
                parse: [],
                roles: [],
                users: []
            }
        }).then(async () => {
            await Bun.sleep(3e3);
            await interaction.deleteReply();
        }).catch(err => {
            this.client.logger.warn("Gateway", `Failed to send message: ${err}`);
        });
    };
}

export default Say;
