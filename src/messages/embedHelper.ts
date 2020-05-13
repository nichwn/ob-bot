import { MessageEmbed, Guild } from 'discord.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { RoleService } from '../services/roleService';
import { compareCaseInsensitive } from '../utils/compare';
import { MessageHandlerWithHelp } from './messageHandler/messageHandler';
import { startSymbol } from '../utils/environment';

@injectable()
export class EmbedHelper {
  private static readonly embedColour = '#DC143C';

  private roleService: RoleService;

  constructor(@inject(TYPES.RoleService) roleService: RoleService) {
    this.roleService = roleService;
  }

  async makeTallyEmbed(
    guild: Guild,
    votes: { [target: string]: string[] },
    notVoted: string[],
  ) {
    const votesUsernamesFetch = Promise.all(
      Object.entries(votes).map(async ([target, voters]) => {
        const targetUsernameFetch = this.playerIdToUsername(guild, target);
        const voterUsernamesFetch = Promise.all(
          voters.map((voter) => this.playerIdToUsername(guild, voter)),
        ).then((usernames) => usernames.sort(compareCaseInsensitive));

        return [await targetUsernameFetch, await voterUsernamesFetch] as [
          string,
          string[],
        ];
      }),
    ).then((votesUsernames) =>
      votesUsernames.sort(
        ([targetA, votesA], [targetB, votesB]) =>
          votesB.length - votesA.length ||
          compareCaseInsensitive(targetA, targetB),
      ),
    );

    const notVotedUsernamesFetch = Promise.all(
      notVoted.map((playerId) => this.playerIdToUsername(guild, playerId)),
    ).then((usernames) => usernames.sort(compareCaseInsensitive));

    const playerRole = await this.roleService.createOrGetPlayerRole(guild);
    const majority = Math.floor(playerRole.members.array().length / 2) + 1;

    const votesUsernames = await votesUsernamesFetch;
    const notVotedUsernames = await notVotedUsernamesFetch;

    const embed = new MessageEmbed()
      .setColor(EmbedHelper.embedColour)
      .setTitle('Vote Tally')
      .setDescription(`${majority} for majority`);

    votesUsernames.forEach((vote) =>
      embed.addField(
        `${vote[0]} (${vote[1].length})`,
        vote[1].join(', ') || '\u200b',
      ),
    );

    embed.addFields({
      name: `No Vote (${notVotedUsernames.length})`,
      value: notVotedUsernames.join(', '),
    });

    return embed;
  }

  private async playerIdToUsername(guild: Guild, playerId: string) {
    return (await guild.members.fetch(playerId)).user.username;
  }

  makeHelpEmbed(handlersByCategory: [number, MessageHandlerWithHelp[]][]) {
    const embed = new MessageEmbed()
      .setColor(EmbedHelper.embedColour)
      .setTitle('Commands');

    handlersByCategory.forEach(([handlerCategory, handlers]) =>
      embed.addField(
        handlerCategory,
        handlers
          .map(
            (handler) =>
              `**${startSymbol}${handler.commandPattern}:** ${handler.helpText}`,
          )
          .join('\n'),
      ),
    );

    return embed;
  }
}
