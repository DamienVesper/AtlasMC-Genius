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

import type { SharedSlashCommand } from "discord.js";
import type { Player } from "magmastream";
import type { SKRSContext2D } from "@napi-rs/canvas";
import { CaseAction } from "../models/Case.js";

/**
 * Common durations used in moderation commands.
 */
export const durations = {
    ["60s"]: 60,
    ["5m"]: 300,
    ["10m"]: 600,
    ["30m"]: 1800,
    ["1h"]: 3600,
    ["6h"]: 3600,
    ["12h"]: 3600,
    ["1d"]: 86400,
    ["7d"]: 604800,
    ["30d"]: 2592e3
};

/**
 * Clean a string of Discord formatting.
 * @param str The string to clean.
 */
export const cleanse = (str: string): string => str.replace(/\*\*\*|\*\*|\*|__|_|~~/g, r => `\\${r}`);

/**
 * Get a Discord timestamp of a date.
 * @param date The date in question.
 * @param type The type of the date. Can be of type t, T, d, D, f, F, and R.
 */
export const timestamp = (date: Date, type?: string): string => `<t:${Math.floor(date.getTime() / 1e3)}:${type ?? "R"}>`;

/**
 * Format a number into a condensed form.
 * @param num The number to format.
 */
export const numToPredicateFormat = (num: number): string =>
    Math.abs(Number(num)) >= 1e21
        ? `${(Math.abs(Number(num)) / 1e21).toFixed(2)}S`
        : Math.abs(Number(num)) >= 1e18
            ? `${(Math.abs(Number(num)) / 1e18).toFixed(2)}QT`
            : Math.abs(Number(num)) >= 1e15
                ? `${(Math.abs(Number(num)) / 1e15).toFixed(2)}Q`
                : Math.abs(Number(num)) >= 1e12
                    ? `${(Math.abs(Number(num)) / 1e12).toFixed(2)}T`
                    : Math.abs(Number(num)) >= 1e9
                        ? `${(Math.abs(Number(num)) / 1e9).toFixed(2)}B`
                        : Math.abs(Number(num)) >= 1e6
                            ? `${(Math.abs(Number(num)) / 1e6).toFixed(2)}M`
                            : Math.abs(Number(num)) >= 1e3
                                ? `${(Math.abs(Number(num)) / 1e3).toFixed(2)}K`
                                : Math.abs(Number(num)).toString();

/**
 * Format a number by the number of bytes it contains, into a condensed form.
 * @param num The number to format.
 */
export const numToBytesFormat = (num: number): string =>
    Math.abs(Number(num)) >= 1024 ** 5
        ? `${(Math.abs(Number(num)) / 1024 ** 5).toFixed(2)}PiB`
        : Math.abs(Number(num)) >= 1024 ** 4
            ? `${(Math.abs(Number(num)) / 1024 ** 4).toFixed(2)}TiB`
            : Math.abs(Number(num)) >= 1024 ** 3
                ? `${(Math.abs(Number(num)) / 1024 ** 3).toFixed(2)}GiB`
                : Math.abs(Number(num)) >= 1024 ** 2
                    ? `${(Math.round(Math.abs(Number(num)) / 1024 ** 2))}MiB`
                    : Math.abs(Number(num)) >= 1024
                        ? `${(Math.round(Math.abs(Number(num)) / 1024))}KiB`
                        : Math.abs(Number(num)).toString();

/**
 * Convert a number to duration form.
 * @param num The number.
 */
export const numToDurationFormat = (num: number): string => {
    const seconds = (Math.trunc(num / 1e3) % 60).toString().padStart(2, "0");
    const minutes = (Math.trunc(num / 6e4) % 60).toString().padStart(2, "0");
    const hours = Math.trunc(num / 36e5);
    return num > 1e12
        ? "Infinite"
        : hours > 0
            ? `${hours}:${minutes}:${seconds}`
            : `${minutes}:${seconds}`;
};

/**
 * Convert a number to cooldown form.
 * @param num The number.
 */
export const numToCooldownFormat = (num: number): string => {
    const days = Math.trunc(num / 864e5);
    const hours = Math.trunc(num / 36e5) % 24;
    const minutes = Math.trunc(num / 6e4) % 60;
    const seconds = (hours > 0 || minutes > 0)
        ? Math.ceil(((num / 1e3) % 60))
        : ((num / 1e3) % 60).toFixed(3);

    return `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;
};

/**
 * Capitalize a string
 * @param str The string to capitalize.
 */
export const capitalize = (string: string): string => string.toString().replace(/^\w/, f => f.toUpperCase()).split(/(?=[A-Z])/).join(" ");

/**
 * Create a progress bar.
 * @param position The position to fill to.
 * @param max The maximum position.
 */
export const createProgressBar = (position: number, max: number): string => {
    const FILLED = "▰";
    const EMPTY = "▱";

    const BAR_LENGTH = 8;

    const barStr = [];
    for (let i = 0; i < BAR_LENGTH; i++) barStr.push((position / max) > ((i + 1) / BAR_LENGTH) ? FILLED : EMPTY);

    return barStr.join("");
};

export const createTrackBar = (player: Player): string => {
    const track = player.queue.current;
    if (track === null) return "ERROR";

    const MAX_LENGTH = 20;
    const COUNT = Math.floor((track.isStream ? 0 : (player.position ?? 0) / track.duration) * MAX_LENGTH);

    return `${numToDurationFormat(player.position)} ${"⎯".repeat(COUNT)}◯${"⎯".repeat(MAX_LENGTH - (COUNT + 1))} ${numToDurationFormat(track.duration)}`;
};

export const createUsageExample = (command: SharedSlashCommand): string => {
    const commandOptions = command.options.map(option => option.toJSON());
    return `/${command.name}${command.options.length > 0 ? ` ${commandOptions.map(option => option.required ? `<${option.name}>` : `[${option.name}]`).join(" ")}` : ""}`;
};

export const getMaxXP = (level: number): number => Math.floor((100 * Math.E * level) / 2);

export const getTotalXP = (level: number, xp: number): number => {
    for (let i = 0; i < level; i++) xp += getMaxXP(i);
    return xp;
};

export const fitText = (context: SKRSContext2D, text: string, maxFontSize: number, maxWidth: number): string => {
    let fontSize = maxFontSize;
    context.font = `${fontSize}px Inter`;
    while (context.measureText(text).width > maxWidth) context.font = `${fontSize -= 2}px Inter`;

    return context.font;
};

/**
 * Convert an action to a string.
 * @param action The action to convert.
 * @param log Whether to output in log-ready form.
 */
export const caseActionToStr = (action: CaseAction, log?: boolean): string => {
    switch (action) {
        case CaseAction.Warn: return "warned";
        case CaseAction.Unwarn: return "unwarned";
        case CaseAction.Mute:
            return log
                ? "muted for {{TIMEOUT_LENGTH}}"
                : "muted";
        case CaseAction.Unmute: return "unmuted";
        case CaseAction.Kick: return "kicked from the server.";
        case CaseAction.Softban: return "softbanned from the server";
        case CaseAction.Hackban: return "hackbanned from the server";
        case CaseAction.Tempban: return "temporarily banned from the server";
        case CaseAction.Ban: return "banned from the server";
        case CaseAction.Unban: return "unbanned from the server";
    }
};

/**
 * Truncate a string to a specified length.
 * @param str The string to potentially truncate.
 * @param maxLength The maximum length of the string (including ellipsis).
 */
export const truncate = (str: string, maxLength: number): string => (
    str.length > maxLength - 3
        ? `${str.substring(0, maxLength)}...`
        : str
);
