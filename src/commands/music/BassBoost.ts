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
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

class BassBoost extends Command {
    cmd = new SlashCommandBuilder()
        .setName("bassboost")
        .setDescription("Boost the player's bass.")
        .addNumberOption(option => option.setName("value").setDescription("The value to bassboost by. Leave blank for default.").setMinValue(0).setMaxValue(10))
        .setContexts(InteractionContextType.Guild);

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: "This command can only be used in a guild!", flags: MessageFlags.Ephemeral });
            return;
        }

        if (interaction.member.voice.channel === null) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "You must be in a voice channel to use that command!")], flags: MessageFlags.Ephemeral });
            return;
        }

        const bassboost = interaction.options.getNumber("value");
        await interaction.deferReply();

        const player = this.client.lavalink.players.get(interaction.guildId);
        if (player === undefined) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "I am not currently in a voice channel!")] });
            return;
        } else if (interaction.member.voice.channel.id !== player.voiceChannelId) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "You must be in the same voice channel as the bot to use that command!")] });
            return;
        }

        if (!this.client.config.modules.music.enabled) throw new Error("Music configuration was not specified or enabled.");

        const mult = this.client.config.modules.music.options.bassIntensityMultiplier;
        await player.filters.setEqualizer((player.filters.equalizer?.filter(v => v.band > 2) ?? []).concat((bassboost ?? 0) === 0
            ? []
            : new Array(3).fill(null).map((_, i) => ({
                band: i,
                gain: (bassboost ?? 0) * mult
            }))));

        await interaction.followUp({ embeds: [this.client.createApproveEmbed(interaction.user, bassboost !== null ? `Set bassboost to **${bassboost}**.` : "Disabled bassboost filter.")] });
    };
}

export default BassBoost;
