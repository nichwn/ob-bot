import { Guild, User } from 'discord.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { DataCache, TallyPlayers } from '../cache/cache';

export interface VoteStatus {
  votes: { [target: string]: Vote[] };
  notVoted: string[];
}

export interface Vote {
  voter: string;
  voteTime: number;
}

@injectable()
export class DataProxy {
  private cache: DataCache;

  constructor(@inject(TYPES.DataCache) cache: DataCache) {
    this.cache = cache;
  }

  async createOrGetPlayerRole(guild: Guild) {
    const guildCache = await this.cache.getCacheForGuild(guild);
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
      .then(async (role) => {
        guildCache.playerRoleId = role.id;
        await this.cache.setCacheForGuild(guild, guildCache);
        return role;
      });
  }

  async isTallyActive(guild: Guild) {
    const guildCache = await this.cache.getCacheForGuild(guild);
    return guildCache.tally.active;
  }

  async createTally(guild: Guild) {
    const guildCache = await this.cache.getCacheForGuild(guild);

    const playerRole = await this.createOrGetPlayerRole(guild);
    const playersWithRole = playerRole.members.map((member) => member.id);

    guildCache.tally = {
      active: true,
      players: playersWithRole.reduce((accu, currentValue) => {
        accu[currentValue] = { target: null, voteTime: null };
        return accu;
      }, {} as TallyPlayers),
    };

    await this.cache.setCacheForGuild(guild, guildCache);
  }

  async cancelTally(guild: Guild) {
    const guildCache = await this.cache.getCacheForGuild(guild);

    guildCache.tally.active = false;

    await this.cache.setCacheForGuild(guild, guildCache);
  }

  async isActivePlayer(guild: Guild, user: User) {
    const guildCache = await this.cache.getCacheForGuild(guild);
    return Object.prototype.hasOwnProperty.call(
      guildCache.tally.players,
      user.id,
    );
  }

  async hasCastedVote(guild: Guild, user: User) {
    const guildCache = await this.cache.getCacheForGuild(guild);
    return (
      this.isActivePlayer(guild, user) &&
      guildCache.tally.players[user.id] !== null
    );
  }

  async votes(guild: Guild): Promise<VoteStatus> {
    const guildCache = await this.cache.getCacheForGuild(guild);

    const initialPlayerVoteState = Object.keys(guildCache.tally.players).reduce(
      (accu, currentValue) => ({
        ...accu,
        [currentValue]: [],
      }),
      {} as { [target: string]: Vote[] },
    );
    const initialVoteState = {
      ...initialPlayerVoteState,
      NO_LYNCH: [],
    };

    return Object.entries(guildCache.tally.players).reduce(
      ({ votes, notVoted }, [voter, target]) => {
        if (target.target === null || target.voteTime === null) {
          notVoted.push(voter);
        } else {
          votes[target.target].push({ voter, voteTime: target.voteTime });
        }
        return { votes, notVoted };
      },
      { votes: initialVoteState, notVoted: [] } as VoteStatus,
    );
  }

  async vote(guild: Guild, voter: User, target: User | 'NO_LYNCH') {
    const guildCache = await this.cache.getCacheForGuild(guild);
    const voterData = guildCache.tally.players[voter.id];

    if (target === 'NO_LYNCH' && voterData.target !== 'NO_LYNCH') {
      voterData.target = target;
      voterData.voteTime = new Date().getTime();
    } else if (target !== 'NO_LYNCH' && voterData.target !== target.id) {
      voterData.target = target.id;
      voterData.voteTime = new Date().getTime();
    }

    await this.cache.setCacheForGuild(guild, guildCache);
  }

  async unvote(guild: Guild, user: User) {
    const guildCache = await this.cache.getCacheForGuild(guild);

    guildCache.tally.players[user.id].target = null;
    guildCache.tally.players[user.id].voteTime = null;

    await this.cache.setCacheForGuild(guild, guildCache);
  }
}
