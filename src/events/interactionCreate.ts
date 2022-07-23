import * as Discord from 'discord.js';
import { Client } from '../typings/discord';

import log from '../utils/log';

export default async (client: Client, interaction: Discord.Interaction): Promise<void> => {
    if (interaction.type === Discord.InteractionType.ApplicationCommand) {
        // Grab the command from the handler.
        const cmd = client.commands?.get(interaction.commandName);

        // If the command doesn't exist, return.
        if (cmd == null) return;

        // Execute the command.
        log(`magenta`, `${interaction.user.tag} [${interaction.user.id}] ran command ${interaction.commandName} in ${(interaction.guild as Discord.Guild)?.name}.`);
        cmd.run(client, interaction);
    }
};
