import { Client } from '../typings/discord';

import log from '../utils/log';
import { logHeader } from '../utils/logExtra';

import refreshActivity from '../utils/refreshActivity';

export default async (client: Client): Promise<void> => {
    log(`green`, `Client has started, with ${client.users.cache.size} user(s) in ${client.guilds.cache.size} guild(s).`);
    logHeader();

    await refreshActivity(client);

    setInterval(() => { void refreshActivity(client); }, 6e5);
};
