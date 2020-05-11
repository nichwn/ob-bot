import { Guild } from 'discord.js';
import { injectable } from 'inversify';
import * as NodeCache from 'node-cache';
import { cloneDeep } from 'lodash';

const cache = new NodeCache();

interface GuildCache {
  playerRoleId?: string;
  tally: {
    active: boolean;
    players: TallyPlayer;
  };
}

interface TallyPlayer {
  [playerId: string]: string | null;
}

const defaultState: GuildCache = { tally: { active: false, players: {} } };

@injectable()
export class DataProxy {
  private getCacheForGuild(guild: Guild): GuildCache {
    return cloneDeep(cache.get(guild.id) ?? defaultState);
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
          mentionable: true,
        },
        reason: 'A game player',
      })
      .then((role) => {
        guildCache.playerRoleId = role.id;
        this.setCacheForGuild(guild, guildCache);
        return role;
      });
  }

  async createTally(guild: Guild) {
    const guildCache = this.getCacheForGuild(guild);

    if (guildCache.tally.active) {
      return false;
    }

    const playerRole = await this.createOrGetPlayerRole(guild);
    const playersWithRole = playerRole.members.map((member) => member.id);
    if (playersWithRole.length < 3) {
      return false;
    }

    guildCache.tally = {
      active: true,
      players: playersWithRole.reduce((accu, currentValue) => {
        console.log(accu);
        accu[currentValue] = null;
        return accu;
      }, {} as TallyPlayer),
    };

    this.setCacheForGuild(guild, guildCache);

    return true;
  }

  cancelTally(guild: Guild) {
    const guildCache = this.getCacheForGuild(guild);

    if (!guildCache.tally.active) {
      return false;
    }

    guildCache.tally.active = false;

    this.setCacheForGuild(guild, guildCache);

    return true;
  }
}
