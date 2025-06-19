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
import type { MusicPlayer } from "../../modules/MusicPlayer.js";
import { LoadTypes } from "magmastream";

class Play extends Command {
    cmd = new SlashCommandBuilder()
        .setName("play")
        .addStringOption(option => option.setName("query").setDescription("The name or link to the song, file, or playlist.").setRequired(true))
        .setDescription("Play a song, audio file, or playlist.")
        .setContexts(InteractionContextType.Guild);

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild() || !interaction.channel?.isTextBased()) {
            await interaction.reply({ content: "This command can only be used in a guild!", flags: MessageFlags.Ephemeral });
            return;
        }

        if (interaction.member.voice.channel === null) {
            await interaction.reply({ embeds: [this.client.createDenyEmbed(interaction.user, "You must be in a voice channel to use that command!")], flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const guildPlayer = this.client.lavalink.players.get(interaction.guildId);
        if (guildPlayer !== undefined && interaction.member.voice.channel.id !== guildPlayer.voiceChannelId) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "You must be in the same voice channel as the bot to use that command!")] });
            return;
        }

        const songInput = interaction.options.getString("query", true);
        const res = await this.client.lavalink.search(songInput, interaction.user);

        if (res.loadType === LoadTypes.Error) {
            this.client.logger.error(`Lavalink Node ${guildPlayer?.node.options.identifier}`, res);
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "There was an error queuing a track.")] });
            return;
        } else if (res.loadType === LoadTypes.Empty) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "I could not find any songs with the provided query.")] });
            return;
        }

        const player = this.client.lavalink.create({
            guildId: interaction.guildId,
            voiceChannelId: interaction.member.voice.channel.id,
            textChannelId: interaction.channel.id,
            volume: 75,
            selfDeafen: true
        }) as MusicPlayer;

        player.connect();

        if (res.loadType === LoadTypes.Playlist && res.playlist !== undefined) {
            player.queue.add(res.playlist.tracks);
            if (!player.playing && !player.paused && player.queue.size === res.playlist.tracks.length) await player.play();

            await interaction.followUp({ embeds: [this.client.createApproveEmbed(interaction.user, `Queued **${res.playlist.tracks.length}** songs.`)] });
        } else {
            const track = res.tracks[0];
            player.queue.add(track);

            if (player.stopped || (!player.playing && !player.paused && !player.queue.size)) {
                await player.play();
                player.stopped = false;
            }

            await interaction.followUp({ embeds: [this.client.createApproveEmbed(interaction.user, `Queued **${track.title}**.`)] });
        }
    };
}

export default Play;
