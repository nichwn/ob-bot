import { injectable, inject } from 'inversify';
import { DataProxy } from '../proxies/dataProxy';
import { TYPES } from '../types';
import { Guild, User } from 'discord.js';
import {
  NoActiveTallyError,
  UserIsNotAPlayerError,
  VoteTargetIsNotAPlayerError,
  InsufficientPlayersError,
  NoCastedVoteError,
} from '../exceptions';
import { ActiveTallyError } from '../exceptions';

@injectable()
export class TallyService {
  private dataProxy: DataProxy;

  constructor(@inject(TYPES.DataProxy) dataProxy: DataProxy) {
    this.dataProxy = dataProxy;
  }

  async createTally(guild: Guild) {
    if (await this.dataProxy.isTallyActive(guild)) {
      throw new ActiveTallyError();
    }

    const playerRole = await this.dataProxy.createOrGetPlayerRole(guild);
    if (playerRole.members.array().length < 3) {
      throw new InsufficientPlayersError();
    }

    await this.dataProxy.createTally(guild);
  }

  async cancelTally(guild: Guild) {
    if (!(await this.dataProxy.isTallyActive(guild))) {
      throw new NoActiveTallyError();
    }

    return this.dataProxy.cancelTally(guild);
  }

  async votes(guild: Guild) {
    if (!(await this.dataProxy.isTallyActive(guild))) {
      throw new NoActiveTallyError();
    }

    return this.dataProxy.votes(guild);
  }

  async vote(guild: Guild, voter: User, target: User | 'NO_LYNCH') {
    if (!(await this.dataProxy.isTallyActive(guild))) {
      throw new NoActiveTallyError();
    }
    if (!(await this.dataProxy.isActivePlayer(guild, voter))) {
      throw new UserIsNotAPlayerError();
    }
    if (
      target !== 'NO_LYNCH' &&
      !(await this.dataProxy.isActivePlayer(guild, target))
    ) {
      throw new VoteTargetIsNotAPlayerError();
    }

    return this.dataProxy.vote(guild, voter, target);
  }

  async unvote(guild: Guild, user: User) {
    if (!(await this.dataProxy.isTallyActive(guild))) {
      throw new NoActiveTallyError();
    } else if (!(await this.dataProxy.isActivePlayer(guild, user))) {
      throw new UserIsNotAPlayerError();
    } else if (!(await this.dataProxy.hasCastedVote(guild, user))) {
      throw new NoCastedVoteError();
    }

    return this.dataProxy.unvote(guild, user);
  }
}
