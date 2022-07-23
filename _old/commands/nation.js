const Discord = require('discord.js');
var towny = require('../index.js');
const config = require('./config.json');

module.exports = {
	name: 'nation',
	description: 'Fetches nation information from Towny API.',
	execute(message, args) {
		if (!args.length) {
			// If there is no arguments (the information after the command) then it will return this
			return message.channel.send('No provided town name.');
		}
		else {
			// Query Towny DB
			towny.mysql.query(`SELECT * FROM ${config.townydatabase}.TOWNY_NATIONS WHERE name = '${args[0]}'`, (err, rows) => {

				// Changing value (Epoch Time) to readable format * 1 (idk why)
				const current_datetime = new Date(rows[0].registered * 1);
				// Format the "readable" format time into a even more presentable format (YYYY-MM-DD)
				const formatted_date = current_datetime.getFullYear(rows[0].registered) + '-' + (current_datetime.getMonth() + 1) + '-' + current_datetime.getDate();

				towny.mysql.query(`SELECT * FROM ${config.townydatabase}.TOWNY_TOWNS WHERE name = '${rows[0].capital}'`, (err, caprows) => {
					const townblock = caprows[0].homeblock.split("#");

					const nationembed = new Discord.MessageEmbed()
						.setColor(rows[0].mapColorHexCode)
						.setTitle(rows[0].name)
						.setURL('https://map.atlasmc.org/#world;flat;' + townblock[1] * 16 + ',64,' + townblock[2] * 16 + ';6')
						.setAuthor('AtlasMC Genius', 'https://cdn.discordapp.com/avatars/829046573966164069/e7e936c145e476b77b052ca28e996c33.png', 'https://atlasmc.org/')
						.setThumbnail('https://minotar.net/avatar/' + caprows[0].mayor)
						.addFields(
							{ name: 'Board', value: rows[0].nationBoard, inline: false },
							{ name: 'Ruler', value: caprows[0].mayor, inline: true },
							{ name: 'Capital', value: rows[0].capital, inline: true },
							{ name: 'Founded', value: formatted_date, inline: true },
							{ name: 'Allies', value: rows[0].allies.length === 0 ? 'None' : rows[0].allies, inline: true },
							{ name: 'Enemies', value: rows[0].enemies.length === 0 ? 'None' : rows[0].enemies, inline: true },
							{ name: 'Tax', value: rows[0].taxes, inline: true },
						)
						.setTimestamp()
						.setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/8a493d15e006610546d8823933e45a3a.png');
					// Sending the Embed to chat
					message.channel.send(nationembed);
				});
			});
		}
	} };