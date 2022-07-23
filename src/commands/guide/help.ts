import config from '../../../config/config';

import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Client } from '../../typings/discord';

const cmd: SlashCommandBuilder = new SlashCommandBuilder()
    .setName(`help`)
    .setDescription(`List all commands.`);

const run = async (client: Client, interaction: Discord.ChatInputCommandInteraction): Promise<void> => {
    const sEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.atlas)
        .addFields([
            {
                name: `Help`,
                value: `Need a little help? Make sure to check out our guide (\`/guide\`) and important Discord channels such as <#780365121716879367>!`
            },
            {
                name: `About the Bot`,
                value: `AtlasMC Genius is a custom Discord bot made by Aiden#2222 and DamienVesper#0001. You can use it to make a suggestion or retrieve information from Towny!`
            }
        ])
        .setTimestamp()
        .setFooter({ text: config.footer });

    await interaction.reply({ embeds: [sEmbed] });
};

export {
    cmd,
    run
};
