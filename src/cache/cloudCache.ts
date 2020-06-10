import { injectable, inject } from 'inversify';
import { DataCache, GuildCache } from './cache';
import { Guild } from 'discord.js';
import { TYPES } from '../types';
import { bucketName } from '../utils/environment';
import { Storage } from '@google-cloud/storage';
import { cloneDeep } from 'lodash';
import Stream from 'stream';

const defaultState: GuildCache = {
  tally: { active: false, majorityType: 'MAJORITY', players: {} },
};

@injectable()
export class CloudCache implements DataCache {
  private readonly storage: Storage;

  constructor(@inject(TYPES.Storage) storage: Storage) {
    this.storage = storage;
  }

  public async getCacheForGuild(guild: Guild): Promise<GuildCache> {
    const fileName = `${guild.id}.json`;
    const gcFile = this.storage.bucket(bucketName).file(fileName);

    const cacheExists = (await gcFile.exists())[0];
    if (!cacheExists) {
      return Promise.resolve(cloneDeep(defaultState));
    }

    return await gcFile
      .download()
      .then((data) => JSON.parse(data[0].toString()));
  }

  public async setCacheForGuild(guild: Guild, guildCache: GuildCache) {
    const dataStream = new Stream.Readable();
    dataStream.push(JSON.stringify(guildCache));
    dataStream.push(null);

    const gcFile = this.storage.bucket(bucketName).file(`${guild.id}.json`);

    await new Promise<void>((resolve, reject) => {
      dataStream
        .pipe(
          gcFile.createWriteStream({
            resumable: false,
          }),
        )
        .on('error', (e: Error) => reject(e))
        .on('finish', () => resolve());
    });
  }
}
