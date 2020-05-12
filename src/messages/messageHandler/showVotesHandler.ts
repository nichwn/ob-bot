import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message, MessageEmbed, Guild } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { UserIsNotAPlayerError, NoActiveTallyError } from '../../exceptions';
import { compareCaseInsensitive } from '../../utils/compare';
import { RoleService } from '../../services/roleService';

@injectable()
export class ShowVotesHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly roleService: RoleService;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.RoleService) roleService,
  ) {
    super('showVotes', MessageCategory.Vote, 'Shows casted votes');
    this.tallyService = tallyService;
    this.roleService = roleService;
  }

  async handle(message: Message) {
    try {
      const [votes, notVoted] = this.tallyService.votes(
        message.guild!,
        message.author,
      );

      const votesUsernamesFetch = Promise.all(
        Object.entries(votes).map(async ([target, voters]) => {
          const targetUsernameFetch = this.playerIdToUsername(
            message.guild!,
            target,
          );
          const voterUsernamesFetch = Promise.all(
            voters.map((voter) =>
              this.playerIdToUsername(message.guild!, voter),
            ),
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
        notVoted.map((playerId) =>
          this.playerIdToUsername(message.guild!, playerId),
        ),
      ).then((usernames) => usernames.sort(compareCaseInsensitive));

      const playerRole = await this.roleService.createOrGetPlayerRole(
        message.guild!,
      );
      const majority = Math.floor(playerRole.members.array().length / 2) + 1;

      const votesUsernames = await votesUsernamesFetch;
      const notVotedUsernames = await notVotedUsernamesFetch;

      const response = new MessageEmbed()
        .setColor('#DC143C')
        .setTitle('Vote Tally')
        .setDescription(`${majority} for majority`);

      votesUsernames.forEach((vote) =>
        response.addField(`${vote[0]} (${vote[1].length})`, vote[1].join(', ')),
      );

      response.addFields({
        name: `No Vote (${notVotedUsernames.length})`,
        value: notVotedUsernames.join(', '),
      });

      message.channel.send(response);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active.';
      } else if (e instanceof UserIsNotAPlayerError) {
        response = 'only players can request a vote tally.';
      } else {
        response = 'something went wrong. Try again later.';
      }

      message.reply(response);
    }
  }

  private async playerIdToUsername(guild: Guild, playerId: string) {
    return (await guild.members.fetch(playerId)).user.username;
  }
}
