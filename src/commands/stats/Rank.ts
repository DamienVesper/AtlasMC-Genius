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
    AttachmentBuilder,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from "discord.js";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { and, eq } from "drizzle-orm";

import { fileURLToPath } from "url";
import { resolve } from "path";

import { Command } from "../../classes/Command.js";

import { User } from "../../models/User.js";

import { fitText, getMaxXP, numToPredicateFormat } from "../../utils/utils.js";
import { fetchLeaderboard } from "../../utils/db.js";

class Rank extends Command {
    cmd = new SlashCommandBuilder()
        .setName("rank")
        .setDescription("View a person's server rank.")
        .addUserOption(option => option.setName("user").setDescription("The user to check."))
        .setContexts(InteractionContextType.Guild);

    run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: "This command can only be used in a guild!", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const userQuery = await this.client.db.select({
            discordId: User.discordId,
            level: User.level,
            xp: User.xp
        }).from(User).where(and(
            eq(User.discordId, interaction.user.id),
            eq(User.guildId, interaction.guildId))
        ).limit(1);

        const dbUser = userQuery.length !== 0 ? userQuery[0] : null;
        if (dbUser === null) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "No account exists for that user!")] });
            return;
        };

        const member = await interaction.guild.members.fetch(dbUser.discordId);
        if (member === null) {
            await interaction.followUp({ embeds: [this.client.createDenyEmbed(interaction.user, "That user could not be found!")] });
            return;
        }

        const lbUsers = await fetchLeaderboard(this.client, interaction.guildId);

        const canvas = createCanvas(934, 282);
        const ctx = canvas.getContext("2d");

        const role = member.roles.highest.color === 0x000000
            ? member.roles.hoist?.color == 0x000000
                ? member.roles.cache.filter(role => role.color !== 0x000000).first() ?? member.roles.highest
                : member.roles.hoist ?? member.roles.highest
            : member.roles.highest;

        const roleColor = role.color.toString(16);
        const roleIsDefaultColor = role.color === 0x000000;

        // Fonts.
        GlobalFonts.registerFromPath(resolve(fileURLToPath(import.meta.url), "../../../../assets/fonts/Inter-Regular.ttf"), "Inter");

        // Background.
        const bgImg = await loadImage(resolve(fileURLToPath(import.meta.url), "../../../../assets/img/background.jpg"));
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: "jpg" }));

        // User data.
        const rankText = `#${(lbUsers?.findIndex(x => x.discordId === interaction.user.id) ?? -1) + 1}`;

        ctx.imageSmoothingEnabled = true;

        ctx.beginPath();
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.closePath();

        // Inner background.
        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.8;

        ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 8);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.closePath();

        // Experience bar.
        ctx.beginPath();
        ctx.fillStyle = "#111111";
        ctx.roundRect(canvas.height - 40, canvas.height - 100, canvas.width - canvas.height - 20, 35, 16);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.fillStyle = `#${roleIsDefaultColor ? "ffffff" : roleColor}`;
        ctx.roundRect(canvas.height - 40, canvas.height - 100, (canvas.width - canvas.height - 20) * (dbUser.xp / getMaxXP(dbUser.level)), 35, 16);
        ctx.fill();
        ctx.closePath();

        // Username.
        ctx.beginPath();
        ctx.font = fitText(ctx, member.user.displayName, 44, 325);
        ctx.fillStyle = "#ffffff";

        ctx.fillText(member.user.displayName, canvas.height - 36, roleIsDefaultColor ? canvas.height - 120 : canvas.height - 150); // 170
        ctx.closePath();

        // Role.
        if (!roleIsDefaultColor) {
            ctx.font = fitText(ctx, role.name.toUpperCase(), 28, 325);
            ctx.fillStyle = `#${roleColor}`;

            ctx.fillText(role.name.toUpperCase(), canvas.height - 36, canvas.height - 110); // 130
        }

        // Experience Text
        ctx.font = "28px Inter";
        ctx.textAlign = "right";

        const xpRequiredTxt = ` / ${numToPredicateFormat(getMaxXP(dbUser.level))} XP`;

        ctx.fillStyle = "#ffffff";
        ctx.fillText(numToPredicateFormat(Math.round(dbUser.xp)), canvas.width - ctx.measureText(xpRequiredTxt).width - 62.5, canvas.height - 110);

        ctx.fillStyle = "#444444";
        ctx.fillText(xpRequiredTxt, canvas.width - 60, canvas.height - 110);

        // Level text.
        ctx.fillStyle = `#${roleColor}`;

        ctx.font = "48px Inter";

        const levelWidth = ctx.measureText(dbUser.level.toString()).width;
        const rankWidth = ctx.measureText(rankText).width;

        ctx.fillText(dbUser.level.toString(), canvas.width - 60, 90);
        ctx.font = "26px Inter";

        const levelTxtWidth = ctx.measureText(" Level ").width;
        ctx.fillText(" Level ", canvas.width - levelWidth - 60, 90);

        // Rank text.
        ctx.font = "48px Inter";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(rankText, canvas.width - levelTxtWidth - levelWidth - 62.5, 90);

        ctx.font = "26px Inter";
        ctx.fillText(" Rank ", canvas.width - levelTxtWidth - levelWidth - rankWidth - 62.5, 90);

        ctx.closePath();

        // Avatar clip.
        ctx.beginPath();
        ctx.arc(canvas.height / 2, canvas.height / 2, (canvas.height - 120) / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        // Avatar.
        ctx.drawImage(avatar, 60, 60, canvas.height - 120, canvas.height - 120);
        await canvas.encode("png").then(async img => {
            const profileCard = new AttachmentBuilder(img, { name: "card.png" });
            await interaction.followUp({ files: [profileCard] });
        });
    };
}

export default Rank;
