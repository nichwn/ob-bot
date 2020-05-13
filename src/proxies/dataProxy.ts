import { Guild, User } from 'discord.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { DataCache, TallyPlayers } from '../cache/cache';

@injectable()
export class DataProxy {
  private cache: DataCache;

  constructor(@inject(TYPES.DataCache) cache: DataCache) {
    this.cache = cache;
  }

  async createOrGetPlayerRole(guild: Guild) {
    const guildCache = this.cache.getCacheForGuild(guild);
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
        this.cache.setCacheForGuild(guild, guildCache);
        return role;
      });
  }

  async removeFromPlayerRole(guild: Guild, player: string) {
    const playerRole = await this.createOrGetPlayerRole(guild);
    (await guild.members.fetch(player)).roles.remove(playerRole);
  }

  isTallyActive(guild: Guild) {
    const guildCache = this.cache.getCacheForGuild(guild);
    return guildCache.tally.active;
  }

  async createTally(guild: Guild) {
    const guildCache = this.cache.getCacheForGuild(guild);

    const playerRole = await this.createOrGetPlayerRole(guild);
    const playersWithRole = playerRole.members.map((member) => member.id);

    guildCache.tally = {
      active: true,
      players: playersWithRole.reduce((accu, currentValue) => {
        accu[currentValue] = null;
        return accu;
      }, {} as TallyPlayers),
    };

    this.cache.setCacheForGuild(guild, guildCache);
  }

  cancelTally(guild: Guild) {
    const guildCache = this.cache.getCacheForGuild(guild);

    guildCache.tally.active = false;

    this.cache.setCacheForGuild(guild, guildCache);
  }

  isActivePlayer(guild: Guild, user: User) {
    const guildCache = this.cache.getCacheForGuild(guild);
    return Object.prototype.hasOwnProperty.call(
      guildCache.tally.players,
      user.id,
    );
  }

  hasCastedVote(guild: Guild, user: User) {
    const guildCache = this.cache.getCacheForGuild(guild);
    return (
      this.isActivePlayer(guild, user) &&
      guildCache.tally.players[user.id] !== null
    );
  }

  votes(guild: Guild): [{ [target: string]: string[] }, string[]] {
    const guildCache = this.cache.getCacheForGuild(guild);

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
    const guildCache = this.cache.getCacheForGuild(guild);

    guildCache.tally.players[voter.id] = target.id;

    this.cache.setCacheForGuild(guild, guildCache);
  }

  unvote(guild: Guild, user: User) {
    const guildCache = this.cache.getCacheForGuild(guild);

    guildCache.tally.players[user.id] = null;

    this.cache.setCacheForGuild(guild, guildCache);
  }
}
