const Discord = require('discord.js');

module.exports = {
	name: 'map',
	description: 'Description about the map',
	execute(message, args) {
		const map = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('AtlasMC Map')
            .setThumbnail('https://cloud.atlasmc.org/s/bW5M8JRXJfnykop/download/bvi7K0u.png')
			.setURL('https://map.atlasmc.org/')
			.setAuthor('AtlasMC Genius', 'https://cdn.discordapp.com/avatars/829046573966164069/e7e936c145e476b77b052ca28e996c33.png', 'https://atlasmc.org/')
			.addFields(
				{ name: 'Earth Map', value: ('On Atlas, we have a map of the Earth at a 1:500 scale. This means that every 500m in real life is equal to one block or 1m in game!') },
				{ name: 'View the Map', value: ('We have a map system where you can view builds, borders, and more on our Earth map by going to https://map.atlasmc.org') },
			)
			.setTimestamp()
			.setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/8a493d15e006610546d8823933e45a3a.png');

		message.channel.send(map);
	},
};