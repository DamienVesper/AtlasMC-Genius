// Getting resources needed for bot (discord, fetch, config, etc.)
const Discord = require('discord.js');
const fs = require('fs');
const config = require('./commands/config.json');
const { MessageEmbed } = require('discord.js');
const mysql = require('mysql');
const client = new Discord.Client({
	intents: [
		'GUILDS',
		'GUILD_MESSAGES',
		'GUILD_MEMBERS',
	],
});

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}


// Notification that bot is logged into Discord
client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity('play.atlasmc.org', { type: 'PLAYING' });
});

const welcomeChannelId = '780365121716879369';
client.on('guildMemberAdd', (member) => {
	const welcome = new MessageEmbed()
		.setColor('#35abe3')
		.setTitle(`Welcome, ${member.user.username}!`)
		.setAuthor('AtlasMC', 'https://i.imgur.com/3wbgb09.png', 'https://atlasmc.org')
		.setDescription(`Welcome to AtlasMC, <@${member.id}>! \nWe are so happy to have you here.\n \nCheck out <#780365121716879367> for rules + information about our server! \nGo to <#784302059636785191> to select what you would like to be notified for. \nCommunicate and stay in touch with the community in <#977028662706716722>.\n \n**IP:** play.atlasmc.org \n**STORE:** https://store.atlasmc.org \n**WEBSITE:** https://atlasmc.org`)
		.setThumbnail('https://cdn.discordapp.com/avatars/' + member.user.id + '/' + member.user.avatar + '.jpeg')
		.setTimestamp()
		.setFooter('Made with ❤️ by Aiden#2704', 'https://cdn.discordapp.com/avatars/573714496250707978/d0ccfcdd1af8cf37b928610a5c5163a3.png');

	member.guild.channels.cache.get(welcomeChannelId).send(welcome);
});

// Towny Connection
var townycon = mysql.createConnection({
	host: config.townyhost,
	user: config.townyuser,
	password: config.townypassword,
	database: config.townydatabase
});

townycon.connect(err => {
	if(err) throw err;
	console.log('Successfully connected to the Towny Database.');
});

exports.mysql = townycon;

// Cancelling any responses to the bot itself or anything without the specified prefix
client.on('message', message => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	// Joke command that finds config.prefix + 'brick' and returns 'fart'
	if (message.content === config.prefix + 'brick') {
		message.channel.send('fart');
	}
	// Command = guide, will return a embed.
	else if (command === 'guide') {
		client.commands.get('guide').execute(message, args);
	}
	else if (command === 'help') {
		client.commands.get('help').execute(message, args);
	}
	else if (command === 'town' || command === 't') {
		client.commands.get('town').execute(message, args);
	}
	else if (command === 'nation' || command === 'n') {
		client.commands.get('nation').execute(message, args);
	}
	else if (command === 'player' || command === 'p' || command === 'res' || command === 'resident' || command === 'user') {
		client.commands.get('resident').execute(message, args);
	}
	else if (command === 'map') {
		client.commands.get('map').execute(message, args);
	}
	else if (command === 'suggest') {
		client.commands.get('suggestions').execute(message, args);
	}
	else if (command === 'approve' || command === 'accept') {
		client.commands.get('approve').execute(message, args);
	}
	else if (command === 'reject' || command === 'deny' || command === 'decline') {
		client.commands.get('reject').execute(message, args);
	}
},

client.login(config.token));
