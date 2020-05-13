import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import {
  NoActiveTallyError,
  UserIsNotAPlayerError,
  VoteTargetIsNotAPlayerError,
} from '../../exceptions';
import { EmbedHelper } from '../embedHelper';
import { maxBy } from 'lodash';
import { calculateMajority } from '../../utils/tally';
import { RoleService } from '../../services/roleService';

@injectable()
export class VoteHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly roleService: RoleService;
  private readonly embedHelper: EmbedHelper;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.RoleService) roleService: RoleService,
    @inject(TYPES.EmbedHelper) embedHelper: EmbedHelper,
  ) {
    super(
      'vote',
      MessageCategory.Vote,
      'Casts a vote for the mentioned player',
    );
    this.tallyService = tallyService;
    this.roleService = roleService;
    this.embedHelper = embedHelper;
  }

  async handle(message: Message) {
    const voter = message.author;
    const targets = message.mentions.users.array();

    if (targets.length === 0) {
      message.reply('mention the player you wish to vote for.');
      return;
    } else if (targets.length > 1) {
      message.reply('you can only vote for 1 player at a time.');
      return;
    }

    try {
      this.tallyService.vote(message.guild!, voter, targets[0]);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active.';
      } else if (e instanceof UserIsNotAPlayerError) {
        response = 'only players can vote.';
      } else if (e instanceof VoteTargetIsNotAPlayerError) {
        response = 'this user cannot be voted for.';
      } else {
        response = 'something went wrong. Try again later.';
      }

      message.reply(response);
      return;
    }

    try {
      const [votes, notVoted] = this.tallyService.votes(message.guild!);

      const targetWithMostVotes = maxBy(
        Object.entries(votes),
        ([, targetVotes]) => targetVotes.length,
      )!;
      const target = targetWithMostVotes[0];
      const targetVotes = targetWithMostVotes[1].length;

      const playerRole = await this.roleService.createOrGetPlayerRole(
        message.guild!,
      );
      const majority = calculateMajority(playerRole.members.array().length);

      const majorityReached = targetVotes >= majority;

      if (majorityReached) {
        const targetUser = await message.guild!.members.fetch(target);
        message.channel.send(`${playerRole}\n${targetUser} has been lynched!`);
      }

      const tallyEmbed = await this.embedHelper.makeTallyEmbed(
        message.guild!,
        votes,
        notVoted,
      );
      const tallyEmbedMessageRequest = message.channel.send(tallyEmbed);

      if (majorityReached) {
        this.tallyService.cancelTally(message.guild!);
        await Promise.all([
          tallyEmbedMessageRequest.then((tallyEmbedMessage) =>
            tallyEmbedMessage.pin(),
          ),
          this.roleService.removeFromPlayerRole(message.guild!, target),
        ]);
      }
    } catch (e) {
      message.reply('something went wrong. Try again later.');
    }
  }
}
