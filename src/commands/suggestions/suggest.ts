import config from '../../../config/config';

import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Client } from '../../typings/discord';
import { discord } from '../../utils/cleanse';

const cmd: Omit<SlashCommandBuilder, `addSubcommand` | `addSubcommandGroup`> = new SlashCommandBuilder()
    .setName(`suggest`)
    .setDescription(`Make a suggestion for AtlasMC.`)
    .addStringOption(option => option.setName(`title`).setDescription(`The title of your suggestion.`).setRequired(true))
    .addStringOption(option => option.setName(`description`).setDescription(`A brief description of your suggestion.`).setRequired(true));

const run = async (client: Client, interaction: Discord.ChatInputCommandInteraction): Promise<void> => {
    const title = discord(interaction.options.getString(`title`, true));
    const desc = discord(interaction.options.getString(`description`, true));

    const sEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.atlas)
        .setAuthor({
            name: `Suggestion from ${interaction.user.tag}`,
            iconURL: interaction.guild?.iconURL() as string
        })
        .setThumbnail(interaction.user.avatarURL())
        .setTitle(title)
        .setDescription(desc)
        .setTimestamp()
        .setFooter({ text: config.footer });

    const channel = (await client.channels.fetch(config.channels.suggestions)) as Discord.TextChannel;

    const message = await channel.send({ embeds: [sEmbed] });
    await message.startThread({
        name: title,
        autoArchiveDuration: Discord.ThreadAutoArchiveDuration.OneWeek
    });

    await message.react(`<:checkmark:978551077899214908>`);
    await message.react(`<:unsure:980387860811235338>`);
    await message.react(`<:xmark:978551077874061312>`);

    await interaction.reply({ content: `Your suggestion has been made!` });
};

export {
    cmd,
    run
};
