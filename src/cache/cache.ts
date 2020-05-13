import { Guild } from 'discord.js';

export interface GuildCache {
  playerRoleId?: string;
  tally: {
    active: boolean;
    players: TallyPlayers;
  };
}

export interface TallyPlayers {
  [playerId: string]: string | null;
}

export interface DataCache {
  getCacheForGuild(guild: Guild): GuildCache;
  setCacheForGuild(guild: Guild, guildCache: GuildCache): void;
}
