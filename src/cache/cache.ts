import { Guild } from 'discord.js';

export interface GuildCache {
  playerRoleId?: string;
  tally: {
    active: boolean;
    majorityType: 'MAJORITY' | 'SUPERMAJORITY';
    players: TallyPlayers;
  };
}

export interface TallyPlayers {
  [playerId: string]: {
    target: string | null;
    voteTime: number | null;
  };
}

export interface DataCache {
  getCacheForGuild(guild: Guild): Promise<GuildCache>;
  setCacheForGuild(guild: Guild, guildCache: GuildCache): Promise<void>;
}
