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

import { ShardingManager } from "discord.js";

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { Logger } from "./Logger.js";

export class ShardManager extends ShardingManager {
    logger: Logger;

    constructor (token: string) {
        super(resolve(dirname(fileURLToPath(import.meta.url)), "./DiscordBot.js"), { token });

        this.logger = new Logger({
            files: {
                log: resolve(fileURLToPath(import.meta.url), "../../logs/console.log"),
                errorLog: resolve(fileURLToPath(import.meta.url), "../../logs/error.log")
            },
            handleExceptions: true
        });
    }
}
