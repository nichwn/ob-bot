import { cloneDeep } from 'lodash';
import { injectable } from 'inversify';
import { DataCache, GuildCache } from './cache';
import { Guild } from 'discord.js';
import NodeCache = require('node-cache');

const cache = new NodeCache();

const defaultState: GuildCache = { tally: { active: false, players: {} } };

@injectable()
export class InMemoryCache implements DataCache {
  public getCacheForGuild(guild: Guild): GuildCache {
    return cloneDeep(cache.get(guild.id) ?? defaultState);
  }

  public setCacheForGuild(guild: Guild, guildCache: GuildCache) {
    cache.set(guild.id, guildCache);
  }
}
