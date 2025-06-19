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
    type ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder
} from "discord.js";

import type { DiscordBot } from "../modules/DiscordBot.js";

import { Command } from "./Command.js";

export abstract class Subcommand {
    client: DiscordBot;

    abstract cmd: SlashCommandSubcommandBuilder;
    config: ConfigType = {
        parent: "",
        botPermissions: [],
        userPermissions: [],
        cooldown: 0
    };

    constructor (client: DiscordBot) {
        this.client = client;
    }

    /**
     * Executed when receiving the interaction.
     * @param interaction The interaction received.
     */
    abstract run: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

interface ConfigType {
    parent: Command["cmd"]["name"]
    botPermissions: bigint[]
    userPermissions: bigint[]
    cooldown: number
}
