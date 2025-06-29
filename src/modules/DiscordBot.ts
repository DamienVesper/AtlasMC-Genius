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

import { config } from "../.config/config.js";

import { RedisClient } from "bun";
import {
    ActionRowBuilder,
    ActivityType,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Collection,
    EmbedBuilder,
    Events,
    GatewayIntentBits,
    Guild,
    Partials,
    Routes,
    SharedSlashCommand,
    SlashCommandBuilder,
    User as DiscordUser,
    type BaseMessageOptions,
    type Snowflake
} from "discord.js";
import {
    Manager,
    ManagerEventTypes,
    Structure,
    type Player
} from "magmastream";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { basename, dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readdir } from "fs/promises";

import { Logger } from "./Logger.js";
import { MusicPlayer } from "./MusicPlayer.js";

import { Command } from "../classes/Command.js";
import { Event } from "../classes/Event.js";
import { Subcommand } from "../classes/Subcommand.js";

import { Case, CaseAction } from "../models/Case.js";
import { Cooldowns } from "../models/Cooldowns.js";
import { User } from "../models/User.js";

import {
    capitalize,
    caseActionToStr,
    cleanse,
    createTrackBar
} from "../utils/utils.js";
import { updateLeaderboards } from "../utils/db.js";

interface DrizzleSchema extends Record<string, unknown> {
    guild: typeof Guild
    user: typeof User
    case: typeof Case
    cooldowns: typeof Cooldowns
}

export class DiscordBot extends Client<true> {
    config = config;

    logger = new Logger({
        files: {
            log: resolve(fileURLToPath(import.meta.url), "../../../logs/console.log"),
            errorLog: resolve(fileURLToPath(import.meta.url), "../../../logs/error.log")
        },
        handleExceptions: true
    });

    commands = new Collection<SharedSlashCommand["name"], Command>();
    cooldowns = new Collection<Snowflake, Collection<SharedSlashCommand["name"], number>>();
    buttons = new Collection<string, null>();
    modals = new Collection<string, null>();

    lavalink!: Manager;
    db: ReturnType<typeof drizzle<DrizzleSchema>>;
    redis?: RedisClient;

    constructor () {
        super({
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.GuildScheduledEvent,
                Partials.Message,
                Partials.Reaction,
                Partials.User
            ],
            intents: [
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.AutoModerationExecution,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildExpressions,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildScheduledEvents,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ],
            presence: {
                status: "dnd",
                activities: [{
                    type: ActivityType.Playing,
                    name: "AtlasMC"
                }]
            }
        });

        // Instantiate the database connection.
        const pool = new Pool({
            ...config.db,
            idleTimeoutMillis: 3e4
        });

        pool.on("error", err => {
            this.logger.error("PostgreSQL", err.stack ?? err.message);
        });

        this.db = drizzle<DrizzleSchema>({ client: pool });

        // Instantiate the redis connection.
        if (config.modules.caching.enabled) {
            this.redis = new RedisClient(config.modules.caching.connectionString);

            this.redis.onconnect = () => {
                this.logger.info("Redis", "Connected to caching database.");
            };

            this.redis.onclose = err => {
                this.logger.error("Redis", err);
            };

            void this.redis.connect();
        }

        // Prepare the Lavalink client.
        if (this.config.modules.music.enabled) {
            Structure.extend("Player", Player => MusicPlayer);
            this.lavalink = new Manager({
                autoPlay: true,
                lastFmApiKey: this.config.modules.music.lastFmApiKey,
                nodes: this.config.modules.music.nodes,
                send: (id, payload) => {
                    const guild = this.guilds.cache.get(id);
                    if (guild) guild.shard.send(payload);
                }
            });

            let killPlayers: NodeJS.Timeout;

            this.lavalink.on(ManagerEventTypes.NodeConnect, node => {
                this.logger.info("Lavalink", `Connected to node ${node.options.identifier}.`);
            });

            this.lavalink.on(ManagerEventTypes.NodeDisconnect, node => {
                this.logger.warn("Lavalink", `Disconnected from node ${node.options.identifier}.`);

                // Kill all players associated with the node after 30 seconds.
                killPlayers = setTimeout(() => {
                    this.lavalink.players.filter(player => player.node === node).forEach(player => void player.destroy());
                }, 3e4);
            });

            this.lavalink.on(ManagerEventTypes.NodeReconnect, node => {
                // Reset and restart all players associated with the node.
                clearInterval(killPlayers);
                this.lavalink.players.filter(player => player.node === node).forEach(player => void player.pause(false));
            });

            this.lavalink.on(ManagerEventTypes.NodeError, (node, error) => {
                this.logger.error("Lavalink", `Node ${node.options.identifier} encountered an error:`, error.message);
            });

            this.lavalink.on(ManagerEventTypes.QueueEnd, player => {
                const channel = this.channels.cache.get(player.textChannelId!);
                if (channel?.isSendable() && !player.paused && player.playing) {
                    void channel.send({ embeds: [this.createEmbed(player.guildId, "Leaving channel as the queue has ended.").setColor(this.config.colors.blue)] });
                    void player.destroy();
                }
            });

            this.lavalink.on(ManagerEventTypes.TrackStart, (player, track) => {
                this.logger.debug(`Lavalink Node ${player.node.options.identifier}`, `Now playing "${track.title}".`);
                if (player.queue.length !== 0 && player.textChannelId !== null) {
                    void this.channels.fetch(player.textChannelId).then(channel => {
                        if (channel?.isSendable()) void channel.send(this.createNowPlayingDetails(player, true));
                    });
                }
            });
        }
    }

    /**
     * Load events.
     * @param dir The directory to load events from.
     */
    loadEvents = async (dir: string): Promise<void> => {
        const files = (await readdir(dir, {
            recursive: true,
            withFileTypes: true
        })).filter(file => file.name.endsWith(".ts") || file.name.endsWith(".js"));

        let eventsLoaded = 0;
        for (const file of files) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const ClientEvent = (await import(pathToFileURL(resolve(file.parentPath, file.name)).href))?.default;
            if (!ClientEvent) continue;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const event = new ClientEvent(this) as Event<Events.Debug>;

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            if (event.config.once) this.once(event.config.name, event.runUnsafe !== undefined ? event.runUnsafe.bind(null) : event.run.bind(null));
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            else this.on(event.config.name as string, event.runUnsafe !== undefined ? event.runUnsafe.bind(null) : event.run.bind(null));

            eventsLoaded++;
        }

        this.logger.debug("Client", `Loaded ${eventsLoaded} events.`);
    };

    /**
     * Load commands.
     * @param dir The directory to load commands from.
     */
    loadCommands = async (dir: string): Promise<void> => {
        // Get all the files (commands and subcommands).
        const files = (await readdir(dir, {
            recursive: true,
            withFileTypes: true
        })).filter(file => file.name.endsWith(".ts") || file.name.endsWith(".js"));

        /**
         * Temporary buffer for subcommands, to defer their loading until all commands have been loaded.
         */
        const subcommands: Subcommand[] = [];

        for (const file of files) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const ClientCommand = (await import(pathToFileURL(resolve(file.parentPath, file.name)).href))?.default;
            if (!ClientCommand) continue;

            if (ClientCommand.prototype instanceof Command) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const command = new ClientCommand(this) as Command;

                const category = basename(dirname(resolve(file.parentPath, file.name)));
                command.category = category;

                this.commands.set(command.cmd.name, command);
            } else if (ClientCommand.prototype instanceof Subcommand) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const subcommand = new ClientCommand(this) as Subcommand;
                subcommands.push(subcommand);
            }
        }

        for (const subcommand of subcommands) {
            const command = this.commands.get(subcommand.config.parent);
            if (!command) continue;

            command.subcommands.set(subcommand.cmd.name, subcommand);

            /**
             * There is probably a cleaner way to do this.
             */
            (command.cmd as SlashCommandBuilder).addSubcommand(subcommand.cmd);
        }

        this.logger.debug("Client", `Loaded ${this.commands.size} commands and ${subcommands.length} subcommands.`);
    };

    /**
     * Deploy commands.
     * @param dev In development mode?
     */
    deployCommands = async (mode: typeof this.config.mode): Promise<void> => {
        try {
            /**
             * Commands here are guaranteed to have a cmd property.
             */
            const commands = this.commands.map(command => command.cmd.toJSON());
            await this.rest.put(mode === "dev"
                ? Routes.applicationGuildCommands(this.user.id, config.dev.guildID)
                : Routes.applicationCommands(this.user.id),
            { body: commands });

            this.logger.info("Gateway", `Deployed all commands ${mode === "dev" ? "in development guild" : "globally"}.`);
        } catch (err: any) {
            this.logger.error("Gateway", err);
        }
    };

    /**
     * Get the value of a cache key.
     * @param key The key, absent of any prefix.
     */
    getCacheKey (key: string): Promise<string | null> {
        return this.redis!.get(`${this.config.modules.caching.prefix}/${key}`);
    }

    /**
     * Set the value of a cache key.
     * @param key The key, absent of any prefix.
     */
    setCacheKey (key: string, value: string): Promise<"OK"> {
        return this.redis!.set(`${this.config.modules.caching.prefix}/${key}`, value);
    }

    /**
     * Setup timers for the client.
     */
    setTimers = async (): Promise<void> => {
        if (this.config.modules.caching.enabled) {
            await updateLeaderboards(this);

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setInterval(updateLeaderboards, 3e5, this);
        }
    };

    /**
     * Create a simple text embed.
     * @param id The ID to display.
     * @param text The text to display.
     */
    createEmbed = (id: Snowflake, text: string): EmbedBuilder => (
        new EmbedBuilder()
            .setColor(this.config.colors.gray)
            .setDescription(text)
            .setTimestamp()
            .setFooter({ text: `ID: ${id}` })
    );

    /**
     * Create a deny embed.
     * @param user The interaction user.
     * @param text The text to display.
     */
    createDenyEmbed = (user: DiscordUser, text: string): EmbedBuilder => this.createEmbed(user.id, `${this.config.emojis.xmark} ${text}`).setColor(this.config.colors.red);

    /**
     * Create an approve embed.
     * @param id The ID of the user running the command.
     * @param text The text to display.
     */
    createApproveEmbed = (user: DiscordUser, text: string): EmbedBuilder => this.createEmbed(user.id, `${this.config.emojis.checkmark} ${text}`).setColor(this.config.colors.green);

    /**
     * Create a case embed to DM to the victim.
     * @param id The ID of the case.
     * @param action The action the moderator took.
     * @param moderator The moderator who took action.
     * @param reason The reason for the action.
     */
    createDMCaseEmbed = (id: number, action: CaseAction, guild: Guild, moderator: DiscordUser, reason: string): EmbedBuilder => (
        /**
         * @todo Link to appeals server for bans.
         */
        new EmbedBuilder()
            .setColor(this.config.colors.red)
            .setDescription([
                `You were ${action}${action.endsWith("n") ? "ed" : action.endsWith("e") ? "d" : "ed"} ${action === CaseAction.Warn || action === CaseAction.Mute || action === CaseAction.Unmute ? "in" : "from"} **${cleanse(guild.name)}**.`,
                `**Reason:** ${cleanse(reason)}`
            ].join("\n"))
            .setTimestamp()
            .setFooter({ text: `Case #${id} | Moderator: ${moderator.username}` })
    );

    /**
     * Create a case embed to reply to the interaction invoker.
     * @param id The ID of the case.
     * @param action The action the moderator took.
     * @param victim The victim of the action.
     * @param guild The guild the action is invoked from.
     */
    createReplyCaseEmbed = (id: number, action: CaseAction, victim: DiscordUser): EmbedBuilder => (
        this.createApproveEmbed(victim, `**${cleanse(victim.displayName)} was ${action}${action.endsWith("n") ? "ed" : action.endsWith("e") ? "d" : "ned"}.**`)
    );

    createCaseEmbed = (id: number, action: CaseAction, moderator: DiscordUser, target: DiscordUser, reason: string): EmbedBuilder => (
        new EmbedBuilder()
            .setColor(this.config.colors.orange)
            .setAuthor({ name: `${capitalize(action)} | Case #${id}` })
            .addFields([
                {
                    name: "User",
                    value: `${target.tag} (<@${target.id}>)`
                },
                {
                    name: "Moderator",
                    value: `${moderator.tag} (<@${moderator.id}>)`
                },
                {
                    name: "Reason",
                    value: reason
                }
            ])
            .setThumbnail(target.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `ID: ${target.id}` })
    );

    createLogEmbed = (id: number, action: CaseAction, perpetrator: DiscordUser, target: DiscordUser, reason: string): EmbedBuilder => {
        const actionStr = caseActionToStr(action);

        const sEmbed = new EmbedBuilder()
            .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
            .setDescription([
                `**${target.tag} (<@${target.id}>) was ${actionStr}.**`,
                "",
                "### Responsible Moderator",
                `<@${perpetrator.id}>`,
                "",
                "### Reason",
                `\`\`\`${cleanse(reason)}\`\`\``
            ].join("\n"))
            .setThumbnail(target.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `ID: ${target.id} | Case #${id}` });

        return sEmbed;
    };

    /**
     * Create an embed and action row component for the currently playing song.
     * @param player The player handling the queue.
     * @param isAutoMessage Whether this is an automatic message (queue message).
     */
    createNowPlayingDetails = (player: Player, isAutoMessage?: boolean): BaseMessageOptions => {
        // Assumes you have done the necessary type guarding for this.
        const song = player.queue.current!;

        let queueLength = 0;
        player.queue.concat(player.queue.current!).forEach(queue => queueLength += queue.duration ?? 0);

        const sEmbed = new EmbedBuilder()
            .setColor(this.config.colors.blue)
            .setThumbnail((song.artworkUrl ?? song.thumbnail))
            .setTimestamp()
            .setFooter({ text: `ID: ${song.requester?.id}` });

        if (isAutoMessage) {
            sEmbed
                .setDescription(`### Now Playing\n**${song.title}**`);
        } else {
            sEmbed
                .setDescription(`### Now Playing\n**${song.title}**\n\n${song.duration > 1e12 ? ":red_circle: LIVE" : createTrackBar(player)}`)
                .setFields([
                    {
                        name: "Requester",
                        value: cleanse(song.requester?.displayName ?? song.requester?.tag ?? "Unknown User"),
                        inline: true
                    },
                    {
                        name: "Voice Channel",
                        value: `<#${player.voiceChannelId}>`,
                        inline: true
                    }
                ]);
        }

        const sRow = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Track Info").setURL(song.uri));

        return {
            embeds: [sEmbed],
            components: [sRow]
        };
    };
}
