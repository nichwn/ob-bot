import { Guild } from 'discord.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { DataProxy } from '../proxies/dataProxy';

@injectable()
export class RoleService {
  private dataProxy: DataProxy;

  constructor(@inject(TYPES.DataProxy) dataProxy: DataProxy) {
    this.dataProxy = dataProxy;
  }

  createOrGetPlayerRole(guild: Guild) {
    return this.dataProxy.createOrGetPlayerRole(guild);
  }
}
