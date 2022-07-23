import config from '../../../config/config';

import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Client } from '../../typings/discord';

const cmd: SlashCommandBuilder = new SlashCommandBuilder()
    .setName(`guide`)
    .setDescription(`View the AtlasMC Wiki.`);

const run = async (client: Client, interaction: Discord.ChatInputCommandInteraction): Promise<void> => {
    const sEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.atlas)
        .setAuthor({
            name: `AtlasMC Guide`,
            iconURL: interaction.guild?.iconURL() as string,
            url: `https://help.atlasmc.org`
        })
        .setDescription(`You can find the guide at [help.atlasmc.org](https://help.atlasmc.org).`)
        .setTimestamp()
        .setFooter({ text: config.footer });

    await interaction.reply({ embeds: [sEmbed] });
};

export {
    cmd,
    run
};
