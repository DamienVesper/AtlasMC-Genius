import config from '../../../config/config';

import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Client } from '../../typings/discord';

const cmd: SlashCommandBuilder = new SlashCommandBuilder()
    .setName(`map`)
    .setDescription(`View the AtlasMC Map.`);

const run = async (client: Client, interaction: Discord.ChatInputCommandInteraction): Promise<void> => {
    const sEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.atlas)
        .setAuthor({
            name: `AtlasMC Map`,
            iconURL: interaction.guild?.iconURL() as string,
            url: `https://map.atlasmc.org`
        })
        .setDescription(`You can view the server dynmap at [map.atlasmc.org](https://map.atlasmc.org).`)
        .setTimestamp()
        .setFooter({ text: config.footer });

    await interaction.reply({ embeds: [sEmbed] });
};

export {
    cmd,
    run
};
