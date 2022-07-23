const Discord = require('discord.js');

module.exports = {
	name: 'reject',
	description: 'Embed command about suggestions',
	execute(message, args, cmd, client, discord) {
        const channel = message.guild.channels.cache.find(c => c.name === 'suggestions');
        
        
        if (args.slice(1).length == 0) {
        	    args.push('No', 'reason', 'provided.')
        }
        
        async function editEmbed () { 
        channel.messages.fetch(args.slice(0, 1).toString())
        .then(msg => {
            const embed = new Discord.MessageEmbed()
            .setColor('#640909')
            .setAuthor('Rejected Suggestion', 'https://i.imgur.com/eXUPt9J.png')
            .setTitle(msg.embeds[0].title)
            .setDescription(msg.embeds[0].description)
            .setThumbnail(msg.embeds[0].thumbnail.url)
            .addFields(
            	{ name: `Rejected by ${message.author.tag}`, value: args.slice(1).join(' ') }
            )
            .setTimestamp()
            .setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/8a493d15e006610546d8823933e45a3a.png');
            
            msg.edit(embed)
        })
        .catch(console.error);
        }

        if(args.length == 3 || args === undefined) {
            return message.channel.send('No suggestion message ID given.')
        } else if (message.member.hasPermission('ADMINISTRATOR') && message.member.hasPermission('MANAGE_MESSAGES')) {
            editEmbed()
            message.channel.send('<:checkmark:978551077899214908> Successfully rejected the suggestion.')
        } else {
          return message.channel.send('You do not have the permissions to do that.')
        }
	},
};