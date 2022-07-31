import config from '../../../config/config';

import * as Discord from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Client } from '../../typings/discord';
import { discord } from '../../utils/cleanse';

const cmd: Omit<SlashCommandBuilder, `addSubcommand` | `addSubcommandGroup`> = new SlashCommandBuilder()
    .setName(`limbo`)
    .setDescription(`Put a suggestion in limbo.`)
    .addStringOption(option => option.setName(`id`).setDescription(`The message ID of the suggestion.`).setRequired(true))
    .addStringOption(option => option.setName(`reason`).setDescription(`A brief reason for putting the suggestion in limbo.`));

const run = async (client: Client, interaction: Discord.ChatInputCommandInteraction): Promise<void> => {
    const member = await (await client.guilds.fetch(interaction.guild?.id as string)).members.fetch(interaction.user.id);
    if (member.roles.highest.name !== `OWNER` && member.roles.highest.name !== `MANAGER` && member.roles.highest.name !== `DEVELOPER` && member.roles.highest.name !== `ADMIN`) {
        await interaction.reply({ content: `You are not permitted to use this!`, ephemeral: true });
        return;
    }

    const messageID = interaction.options.getString(`id`, true);
    const reason = interaction.options.getString(`reason`);

    const message = await (await client.channels.fetch(config.channels.suggestions) as Discord.TextChannel).messages.fetch(messageID);
    const sEmbed = message.embeds[0];

    const suggestor = ((sEmbed.author as Discord.EmbedAuthorData).name.split(`|`).pop() as string).slice(1);

    if (sEmbed.color === config.colors.yellow) {
        await interaction.reply({ content: `That suggestion has already been put into limbo!`, ephemeral: true });
        return;
    }

    const xEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.yellow)
        .setAuthor({
            name: `Suggestion in Limbo | ${suggestor}`,
            iconURL: `https://cdn.discordapp.com/emojis/980387860811235338.webp`
        })
        .setThumbnail((sEmbed.thumbnail as Discord.EmbedAssetData).url)
        .setTitle(sEmbed.title as string)
        .setDescription(sEmbed.description as string)
        .addFields([{
            name: `Put in limbo by ${interaction.user.tag}`,
            value: reason !== null ? discord(reason) : `This suggestion was put in limbo and is currently being looked into.`
        }])
        .setTimestamp()
        .setFooter({ text: config.footer });

    const replyEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.yellow)
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.avatarURL() as string })
        .setTitle(`Suggestion Put in Limbo`)
        .setDescription(`That suggestion has been put in limbo.\nYou can find it [here](${message.url}).`)
        .setTimestamp()
        .setFooter({ text: config.footer, iconURL: interaction.guild?.iconURL() as string });

    await message.edit({ embeds: [xEmbed] });
    await interaction.reply({ embeds: [replyEmbed] });
};

export {
    cmd,
    run
};
