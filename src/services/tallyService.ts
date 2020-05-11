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

  createTally(guild: Guild) {
    return this.dataProxy.createTally(guild);
  }

  cancelTally(guild: Guild) {
    return this.dataProxy.cancelTally(guild);
  }
}
