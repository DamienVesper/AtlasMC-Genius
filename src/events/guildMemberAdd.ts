import config from '../../config/config';

import * as Discord from 'discord.js';

import { Client } from '../typings/discord';

export default async (client: Client, member: Discord.GuildMember): Promise<void> => {
    if (process.env.GUILD_ID !== member.guild.id || member.user.bot) return;

    const channel = (await member.guild.channels.fetch(config.channels.welcome) as Discord.TextChannel);

    const sEmbed = new Discord.EmbedBuilder()
        .setColor(config.colors.atlas)
        .setAuthor({
            name: `AtlasMC`,
            iconURL: member.guild.iconURL() as string,
            url: `https://atlasmc.org`
        })
        .setThumbnail(member.user.avatarURL())
        .setTitle(`Welcome, ${member.user.username}!`)
        .setDescription(`Welcome to AtlasMC, <@${member.user.id}>!\nWe are so happy to have you here!\n\nCheck out <#780365121716879367> for rules + information about our server!\nGo to <#784302059636785191> to select what pings you would like to be notified for.\nCommunicate and stay in touch with the community in <#977028662706716722>.\n\n**IP:** play.atlasmc.org\n**STORE:** [store.atlasmc.org](https://store.atlasmc.org)\n**WEBSITE:** [atlasmc.org](https://atlasmc.org)`)
        .setTimestamp()
        .setFooter({ text: config.footer });

    await channel.send({ embeds: [sEmbed] });
};
