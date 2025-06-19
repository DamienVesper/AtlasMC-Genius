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
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    type ChatInputCommandInteraction
} from "discord.js";

import { Command } from "../../classes/Command.js";

import type { MusicPlayer } from "../../modules/MusicPlayer.js";
import { Paginator } from "../../modules/Paginator.js";

class Lyrics extends Command {
    cmd = new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("View the lyrics of the current song.")
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

        await interaction.deferReply();

        const player = this.client.lavalink.players.get(interaction.guildId) as MusicPlayer;
        if (player === undefined) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "I am not currently in a voice channel!")] });
            return;
        } else if (interaction.member.voice.channel.id !== player.voiceChannelId) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "You must be in the same voice channel as the bot to use that command!")] });
            return;
        } else if (player.queue.current === null) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "No song is currently playing!")] });
            return;
        }

        // @ts-expect-error SessionID is private.
        const lyrics: Partial<SongLyrics> | null = await player.node.rest.get(`/v4/sessions/${player.node.rest.sessionId}/players/${interaction.guildId}/track/lyrics?skipTrackSource=true`);
        if (lyrics?.lines === undefined) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "I could not find any lyrics for that track!")] });
            return;
        }

        const embeds: EmbedBuilder[] = [];
        for (let i = 0; i < lyrics.lines.length; i += 20) {
            const sEmbed = new EmbedBuilder()
                .setColor(this.client.config.colors.blue)
                .setDescription([
                    `### Lyrics for "${player.queue.current.title}"`
                ].concat(lyrics.lines.slice(i, Math.min(i + 20, lyrics.lines.length)).map(line => line.line)).join("\n"))
                .setThumbnail((player.queue.current.artworkUrl ?? player.queue.current.thumbnail) ?? null)
                .setTimestamp()
                .setFooter({ text: `ID: ${interaction.user.id}` });
            embeds.push(sEmbed);
        }

        if (embeds.length === 1) await interaction.followUp({ embeds });
        else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const paginator = new Paginator(this.client, interaction, interaction.user, embeds);
        }
    };
}

/**
 * Song lyrics provided by LavaLyrics.
 */
interface SongLyrics {
    sourceName: string
    provider: string
    text: string | null
    lines: Array<{
        timestamp: number
        duration: number | null
        line: string
        plugin: Record<never, never>
    }>
}

export default Lyrics;
