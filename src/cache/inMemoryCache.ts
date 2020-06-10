import { cloneDeep } from 'lodash';
import { injectable } from 'inversify';
import { DataCache, GuildCache } from './cache';
import { Guild } from 'discord.js';
import NodeCache = require('node-cache');

const cache = new NodeCache();

const defaultState: GuildCache = {
  tally: { active: false, majorityType: 'MAJORITY', players: {} },
};

@injectable()
export class InMemoryCache implements DataCache {
  public getCacheForGuild(guild: Guild) {
    return Promise.resolve<GuildCache>(
      cloneDeep(cache.get(guild.id) ?? defaultState),
    );
  }

  public setCacheForGuild(guild: Guild, guildCache: GuildCache) {
    cache.set(guild.id, guildCache);
    return Promise.resolve();
  }
}
