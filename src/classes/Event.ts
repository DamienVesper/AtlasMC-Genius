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

import type { ClientEvents } from "discord.js";

import { DiscordBot } from "../modules/DiscordBot.js";

interface EventConfig<T> {
    name: T
    once: boolean
}

export class Event<T extends keyof ClientEvents> {
    client: DiscordBot;
    config!: EventConfig<T>;

    constructor (client: DiscordBot) {
        this.client = client;
    }

    /**
     * Executed when the event is received.
     */
    run!: (...args: ClientEvents[T]) => Promise<void>;

    /**
     * For more specific events.
     */
    runUnsafe?: (...args: any[]) => Promise<void>;
}
