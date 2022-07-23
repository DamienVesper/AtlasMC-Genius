const Discord = require('discord.js');
var towny = require('../index.js');
const config = require('./config.json');

module.exports = {
	name: 'resident',
	description: 'Fetches resident information from Towny API.',
	execute(message, args) {
		if (!args.length) {
			// If there is no arguments (the information after the command) then it will return this
			return message.channel.send('No provided player name.');
		}
		else {
			// Query Towny DB
			towny.mysql.query(`SELECT * FROM ${config.townydatabase}.TOWNY_RESIDENTS WHERE name = '${args[0]}'`, (err, rows) => {
				if(err) throw err;

				// First Join Time conversion
				const current_joinTime = new Date(rows[0].registered * 1);
				const joinDate = current_joinTime.getFullYear(rows[0].registered) + '-' + (current_joinTime.getMonth() + 1) + '-' + current_joinTime.getDate();

				// Last OnlineTime conversion
				const current_onlineTime = new Date(rows[0].lastOnline * 1);
				const lastOnline = current_onlineTime.getFullYear(rows[0].lastOnline) + '-' + (current_onlineTime.getMonth() + 1) + '-' + current_onlineTime.getDate();

				// Check if playername is valid
				if (rows.length > 0) {

					const residentembed = new Discord.MessageEmbed()
						.setColor('#35abe3')
						.setTitle(rows[0].name)
						.setAuthor('AtlasMC Genius', 'https://cdn.discordapp.com/avatars/829046573966164069/e7e936c145e476b77b052ca28e996c33.png', 'https://atlasmc.org/')
						.setThumbnail('http://minotar.net/avatar/' + rows[0].name)
						.addFields(
							{ name: 'Name', value: rows[0].name, inline: false },
							{ name: 'Town', value: rows[0].town.length === 0 ? 'None' : rows[0].town, inline: true },
							{ name: 'Friends', value: rows[0].friends.length === 0 ? 'None' : rows[0].friends, inline: true },
							{ name: 'First Join', value: joinDate, inline: true },
							{ name: 'Last Online', value: lastOnline, inline: true },
						)
						.setTimestamp()
						.setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/8a493d15e006610546d8823933e45a3a.png');
					// Sending the Embed to chat
					message.channel.send(residentembed);
				}
				else {
					message.channel.send('You did not send a valid player name. Check capitalization or grammar.');
				}
			});
		}
	},
};