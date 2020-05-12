import { injectable, inject } from 'inversify';
import { DataProxy } from '../proxies/dataProxy';
import { TYPES } from '../types';
import { Guild } from 'discord.js';

@injectable()
export class TallyService {
  private dataProxy: DataProxy;

  constructor(@inject(TYPES.DataProxy) dataProxy: DataProxy) {
    this.dataProxy = dataProxy;
  }

  async createTally(guild: Guild) {
    if (!this.dataProxy.isTallyActive(guild)) {
      const playerRole = await this.dataProxy.createOrGetPlayerRole(guild);
      if (playerRole.members.array().length >= 3) {
        await this.dataProxy.createTally(guild);
        return true;
      }
    }
    return false;
  }

  cancelTally(guild: Guild) {
    if (this.dataProxy.isTallyActive(guild)) {
      this.dataProxy.cancelTally(guild);
      return true;
    }
    return false;
  }

  votePlayer(guild: Guild, voter: User, target: User) {
    if (!this.dataProxy.isTallyActive(guild)) {
      throw new NoActiveTallyError();
    }
    if (!this.dataProxy.isActivePlayer(guild, voter)) {
      throw new VoterDoesNotExistError();
    }
    if (!this.dataProxy.isActivePlayer(guild, target)) {
      throw new VoteTargetDoesNotExistError();
    }

    this.dataProxy.votePlayer(guild, voter, target);
  }
}
