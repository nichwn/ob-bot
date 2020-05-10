import { Guild } from 'discord.js';
import { injectable } from 'inversify';
import * as NodeCache from 'node-cache';

const cache = new NodeCache();

interface GuildCache {
  playerRoleId?: string;
}

@injectable()
export class DataProxy {
  private getCacheForGuild(guild: Guild): GuildCache {
    return cache.get(guild.id) ?? {};
  }

  private setCacheForGuild(guild: Guild, guildCache: GuildCache) {
    cache.set(guild.id, guildCache);
  }

  async createOrGetPlayerRole(guild: Guild) {
    const guildCache = this.getCacheForGuild(guild);
    const playerRoleId = guildCache.playerRoleId;
    const cachedRole = playerRoleId && (await guild.roles.fetch(playerRoleId));

    if (cachedRole) {
      return cachedRole;
    }
    return guild.roles
      .create({
        data: {
          name: 'Player',
        },
        reason: 'A game player',
      })
      .then((role) => {
        this.setCacheForGuild(guild, {
          ...guildCache,
          playerRoleId: role.id,
        });
        return role;
      });
  }
}
