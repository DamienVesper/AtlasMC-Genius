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

// import {
//     EmbedBuilder,
//     SlashCommandBuilder,
//     type ChatInputCommandInteraction
// } from "discord.js";

// import { Command } from "../../classes/Command.js";

// class Links extends Command {
//     cmd = new SlashCommandBuilder()
//         .setName("links")
//         .setDescription("View useful links.");

//     run = async (interaction: ChatInputCommandInteraction): Promise<void> => {
//         const sEmbed = new EmbedBuilder()
//             .setColor(this.client.config.colors.orange)
//             .setDescription([
//                 "### Useful Links",
//                 `- [Rules](https://${this.client.config.customData.links.rules})`,
//                 `- [Map](https://map.${this.client.config.customData.domain}`,
//                 `- [Bans](https://bans.${this.client.config.customData.domain}`,
//                 `- [Bot GitHub](https://github.com/${this.client.config.customData.github.botRepo})`
//             ].join("\n"))
//             .setThumbnail(interaction.guild?.iconURL() ?? null)
//             .setTimestamp()
//             .setFooter({ text: `ID: ${interaction.user.id}` });

//         await interaction.reply({ embeds: [sEmbed] });
//     };
// }

// export default Links;
