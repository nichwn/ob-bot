import { MessageEmbed, Guild } from 'discord.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { RoleService } from '../services/roleService';
import { compareCaseInsensitive } from '../utils/compare';
import { MessageHandlerWithHelp } from './messageHandler/messageHandler';
import { startSymbol } from '../utils/environment';
import { calculateMajority } from '../utils/tally';
import { VoteStatus } from '../proxies/dataProxy';
import { TallyService } from '../services/tallyService';

@injectable()
export class EmbedHelper {
  private static readonly embedColour = '#DC143C';

  private roleService: RoleService;
  private tallyService: TallyService;

  constructor(
    @inject(TYPES.RoleService) roleService: RoleService,
    @inject(TYPES.TallyService) tallyService: TallyService,
  ) {
    this.roleService = roleService;
    this.tallyService = tallyService;
  }

  async makeTallyEmbed(guild: Guild, { votes, notVoted }: VoteStatus) {
    const votesDisplayNamesFetch = Promise.all(
      Object.entries(votes).map(async ([target, targetVotes]) => {
        const targetDisplayNameFetch = this.playerIdToDisplayName(
          guild,
          target,
        );
        const voterDisplayNamesFetch = Promise.all(
          targetVotes.map(async ({ voter, voteTime }) => {
            const displayName = await this.playerIdToDisplayName(guild, voter);
            return { displayName, voteTime };
          }),
        )
          .then((votersWithDisplayNamesAndTime) =>
            votersWithDisplayNamesAndTime.sort(
              (voterA, voterB) =>
                voterA.voteTime - voterB.voteTime ||
                compareCaseInsensitive(voterA.displayName, voterB.displayName),
            ),
          )
          .then((sortedVotersWithDisplayNamesAndTime) =>
            sortedVotersWithDisplayNamesAndTime.map(
              (voter) => voter.displayName,
            ),
          );

        return [await targetDisplayNameFetch, await voterDisplayNamesFetch] as [
          string,
          string[],
        ];
      }),
    ).then((votesDisplayNames) =>
      votesDisplayNames.sort(
        ([targetA, votesA], [targetB, votesB]) =>
          votesB.length - votesA.length ||
          compareCaseInsensitive(targetA, targetB),
      ),
    );

    const notVotedDisplayNamesFetch = Promise.all(
      notVoted.map((playerId) => this.playerIdToDisplayName(guild, playerId)),
    ).then((displayNames) => displayNames.sort(compareCaseInsensitive));

    const playerRole = await this.roleService.createOrGetPlayerRole(guild);
    const majorityType = await this.tallyService.majorityType(guild);
    const majority = calculateMajority(
      majorityType,
      playerRole.members.array().length,
    );

    const votesDisplayNames = await votesDisplayNamesFetch;
    const notVotedDisplayNames = await notVotedDisplayNamesFetch;

    const embed = new MessageEmbed()
      .setColor(EmbedHelper.embedColour)
      .setTitle('Vote Tally')
      .setDescription(`${majority} for majority`);

    votesDisplayNames.forEach((vote) => {
      embed.addField(
        `${vote[0]} (${vote[1].length})`,
        vote[1].join(', ') || '\u200b',
        true,
      );
    });

    embed.addField(
      `Not Voted (${notVotedDisplayNames.length})`,
      notVotedDisplayNames.join(', ') || '\u200b',
    );

    return embed;
  }

  private async playerIdToDisplayName(guild: Guild, playerId: string) {
    if (playerId === 'NO_LYNCH') {
      return 'No Lynch';
    }

    const displayName = guild.member(playerId)?.displayName;
    if (displayName) {
      return displayName;
    }

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
              `**${startSymbol}${handler.commandPattern}**: ${handler.helpText}`,
          )
          .join('\n'),
      ),
    );

    return embed;
  }
}
