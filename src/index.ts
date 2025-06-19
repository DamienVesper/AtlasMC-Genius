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

import { resolve } from "path";
import { fileURLToPath } from "url";

import { DiscordBot } from "./modules/DiscordBot.js";

const main = async (): Promise<void> => {
    const client = new DiscordBot();

    await client.loadEvents(resolve(fileURLToPath(import.meta.url), "../events"));
    await client.loadCommands(resolve(fileURLToPath(import.meta.url), "../commands"));

    await client.login(process.env.DISCORD_TOKEN);
};

void main();
