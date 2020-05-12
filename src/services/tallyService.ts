import { injectable, inject } from 'inversify';
import { DataProxy } from '../proxies/dataProxy';
import { TYPES } from '../types';
import { Guild, User } from 'discord.js';
import {
  NoActiveTallyError,
  VoterDoesNotExistError,
  VoteTargetDoesNotExistError,
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
    if (this.dataProxy.isTallyActive(guild)) {
      throw new ActiveTallyError();
    }

    const playerRole = await this.dataProxy.createOrGetPlayerRole(guild);
    if (playerRole.members.array().length < 3) {
      throw new InsufficientPlayersError();
    }

    await this.dataProxy.createTally(guild);
  }

  cancelTally(guild: Guild) {
    if (!this.dataProxy.isTallyActive(guild)) {
      throw new NoActiveTallyError();
    }

    this.dataProxy.cancelTally(guild);
  }

  vote(guild: Guild, voter: User, target: User) {
    if (!this.dataProxy.isTallyActive(guild)) {
      throw new NoActiveTallyError();
    }
    if (!this.dataProxy.isActivePlayer(guild, voter)) {
      throw new VoterDoesNotExistError();
    }
    if (!this.dataProxy.isActivePlayer(guild, target)) {
      throw new VoteTargetDoesNotExistError();
    }

    this.dataProxy.vote(guild, voter, target);
  }

  unvote(guild: Guild, user: User) {
    if (!this.dataProxy.isTallyActive(guild)) {
      throw new NoActiveTallyError();
    } else if (!this.dataProxy.isActivePlayer(guild, user)) {
      throw new VoterDoesNotExistError();
    } else if (!this.dataProxy.hasCastedVote(guild, user)) {
      throw new NoCastedVoteError();
    }

    this.dataProxy.unvote(guild, user);
  }
}
