import { Guild, User } from 'discord.js';
import { injectable } from 'inversify';
import * as NodeCache from 'node-cache';
import { cloneDeep } from 'lodash';

const cache = new NodeCache();

interface GuildCache {
  playerRoleId?: string;
  tally: {
    active: boolean;
    players: TallyPlayers;
  };
}

interface TallyPlayers {
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

  isTallyActive(guild: Guild) {
    const guildCache = this.getCacheForGuild(guild);
    return guildCache.tally.active;
  }

  async createTally(guild: Guild) {
    const guildCache = this.getCacheForGuild(guild);

    const playerRole = await this.createOrGetPlayerRole(guild);
    const playersWithRole = playerRole.members.map((member) => member.id);

    guildCache.tally = {
      active: true,
      players: playersWithRole.reduce((accu, currentValue) => {
        accu[currentValue] = null;
        return accu;
      }, {} as TallyPlayers),
    };

    this.setCacheForGuild(guild, guildCache);
  }

  cancelTally(guild: Guild) {
    const guildCache = this.getCacheForGuild(guild);

    guildCache.tally.active = false;

    this.setCacheForGuild(guild, guildCache);
  }

  isActivePlayer(guild: Guild, user: User) {
    const guildCache = this.getCacheForGuild(guild);
    return Object.prototype.hasOwnProperty.call(
      guildCache.tally.players,
      user.id,
    );
  }

  hasCastedVote(guild: Guild, user: User) {
    const guildCache = this.getCacheForGuild(guild);
    return (
      this.isActivePlayer(guild, user) &&
      guildCache.tally.players[user.id] !== null
    );
  }

  votes(guild: Guild): [{ [target: string]: string[] }, string[]] {
    const guildCache = this.getCacheForGuild(guild);

    const initialVoteState = Object.keys(guildCache.tally.players).reduce(
      (accu, currentValue) => ({
        ...accu,
        [currentValue]: [],
      }),
      {} as { [target: string]: string[] },
    );

    return Object.entries(guildCache.tally.players).reduce(
      ([votes, notVoted], [voter, target]) => {
        if (target === null) {
          notVoted.push(voter);
        } else {
          votes[target].push(voter);
        }
        return [votes, notVoted];
      },
      [initialVoteState, [] as string[]],
    );
  }

  vote(guild: Guild, voter: User, target: User) {
    const guildCache = this.getCacheForGuild(guild);

    guildCache.tally.players[voter.id] = target.id;

    this.setCacheForGuild(guild, guildCache);
  }

  unvote(guild: Guild, user: User) {
    const guildCache = this.getCacheForGuild(guild);

    guildCache.tally.players[user.id] = null;

    this.setCacheForGuild(guild, guildCache);
  }
}
