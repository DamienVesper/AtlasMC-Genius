const Discord = require('discord.js');

module.exports = {
	name: 'suggestions',
	description: 'Embed command about suggestions',
	execute(message, args, cmd, client, discord) {
        const channel = message.guild.channels.cache.find(c => c.name === 'suggestions');
        
        let messageArgs = args.join(' ');
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setAuthor('New Suggestion', 'https://i.imgur.com/jo75PLA.png')
        .setTitle(`Suggestion from ${message.author.tag}`)
        .setDescription(messageArgs)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/8a493d15e006610546d8823933e45a3a.png');
        
        if(!channel) {
            return message.channel.send('The Suggestions channel does not exist currently!')
        } else if (args.length == 0 || args === undefined ) {
            return message.channel.send('You did not put anything to suggest.')
        } else {
            message.channel.send('<:checkmark:978551077899214908> Your suggestion has now been submitted to <#978077094871466094>!')
            message.channel.send(embed)
            channel.send(embed).then((msg) => {
            msg.react('<:checkmark:978551077899214908>');
            msg.react('<:unsure:980387860811235338>');
            msg.react('<:xmark:978551077874061312>');
            })
        }
	},
};