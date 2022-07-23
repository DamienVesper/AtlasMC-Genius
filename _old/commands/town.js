const Discord = require('discord.js');
var towny = require('../index.js');
const config = require('./config.json');

module.exports = {
	name: 'town',
	description: 'Fetches town information from Towny API.',
	execute(message, args) {
		if (!args.length) {
			// If there is no arguments (the information after the command) then it will return this
			return message.channel.send('No provided town name.');
		}
		else {

			// Query Towny DB
			towny.mysql.query(`SELECT * FROM ${config.townydatabase}.TOWNY_TOWNS WHERE name = '${args[0]}'`, (err, rows) => {

				const townblock = rows[0].homeblock.split("#");
				// Changing value (Epoch Time) to readable format * 1 (idk why)
				const current_datetime = new Date(rows[0].registered * 1);
				// Format the "readable" format time into a even more presentable format (YYYY-MM-DD)
				const formatted_date = current_datetime.getFullYear(rows[0].registered) + '-' + (current_datetime.getMonth() + 1) + '-' + current_datetime.getDate();

				if (rows.length > 0) {
					const townembed = new Discord.MessageEmbed()
						.setColor('#35abe3')
						.setTitle(rows[0].nation.length === 0 ? rows[0].name : `${rows[0].name}, ${rows[0].nation}`)
						.setURL('https://map.atlasmc.org/#world;flat;' + townblock[1] * 16 + ',64,' + townblock[2] * 16 + ';6')
						.setAuthor('AtlasMC Genius', 'https://cdn.discordapp.com/avatars/829046573966164069/e7e936c145e476b77b052ca28e996c33.png', 'https://atlasmc.org/')
						.setThumbnail('https://minotar.net/avatar/' + rows[0].mayor)
						.addFields(
							{ name: 'Board', value: rows[0].townBoard, inline: false },
							{ name: 'Mayor', value: rows[0].mayor, inline: true },
							{ name: 'Nation', value: rows[0].nation.length === 0 ? 'None' : rows[0].nation, inline: true },
							{ name: 'Founded', value: formatted_date, inline: true },
							{ name: 'Tax', value: rows[0].taxes, inline: true },
							{ name: 'Debt', value: rows[0].debtBalance, inline: true },
							{ name: 'Outlaws', value: rows[0].outlaws.length === 0 ? 'None' : rows[0].outlaws, inline: true },
						)
						.setTimestamp()
						.setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/8a493d15e006610546d8823933e45a3a.png');
					// Sending the Embed to chat
					message.channel.send(townembed);
				}
				else {
					return message.channel.send('You did not send a valid town name. Check capitalization or grammar.');
				}
			});
		}
	} };