import { User, Message } from 'discord.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { RoleService } from '../services/roleService';
import { calculateMajority } from '../utils/tally';
import { TallyService } from '../services/tallyService';
import { EmbedHelper } from './embedHelper';
import {
  NoActiveTallyError,
  UserIsNotAPlayerError,
  VoteTargetIsNotAPlayerError,
} from '../exceptions';
import { maxBy } from 'lodash';

@injectable()
export class VoteHelper {
  private readonly tallyService: TallyService;
  private readonly roleService: RoleService;
  private readonly embedHelper: EmbedHelper;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.RoleService) roleService: RoleService,
    @inject(TYPES.EmbedHelper) embedHelper: EmbedHelper,
  ) {
    this.tallyService = tallyService;
    this.roleService = roleService;
    this.embedHelper = embedHelper;
  }

  async vote(message: Message, voter: User, target: User | 'NO_LYNCH') {
    try {
      await this.tallyService.vote(message.guild!, voter, target);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active.';
      } else if (e instanceof UserIsNotAPlayerError) {
        response = 'only players can vote.';
      } else if (e instanceof VoteTargetIsNotAPlayerError) {
        response = 'this user cannot be voted for.';
      } else {
        throw e;
      }

      await message.reply(response);
      return;
    }

    const voteStatus = await this.tallyService.votes(message.guild!);
    const { votes } = voteStatus;

    const targetWithMostVotes = maxBy(
      Object.entries(votes),
      ([, targetVotes]) => targetVotes.length,
    )!;
    const targetWithMostVotesId = targetWithMostVotes[0];
    const targetWithMostVotesCount = targetWithMostVotes[1].length;

    const playerRole = await this.roleService.createOrGetPlayerRole(
      message.guild!,
    );
    const majority = calculateMajority(playerRole.members.array().length);

    const majorityReached = targetWithMostVotesCount >= majority;

    await message.react('✅');

    if (majorityReached) {
      if (targetWithMostVotesId !== 'NO_LYNCH') {
        const targetWithMostVotesUser = await message.guild!.members.fetch(
          targetWithMostVotesId,
        );
        await message.channel.send(
          `${playerRole}\n${targetWithMostVotesUser} has been lynched!`,
        );
      } else {
        await message.channel.send(`${playerRole}\nA No Lynch has occurred!`);
      }

      const tallyEmbed = await this.embedHelper.makeTallyEmbed(
        message.guild!,
        voteStatus,
      );
      const tallyEmbedMessageRequest = message.channel.send(tallyEmbed);

      this.tallyService.cancelTally(message.guild!);

      await Promise.all([
        tallyEmbedMessageRequest.then((tallyEmbedMessage) =>
          tallyEmbedMessage.pin(),
        ),
        targetWithMostVotesId === 'NO_LYNCH'
          ? Promise.resolve()
          : this.roleService.removeFromPlayerRole(
              message.guild!,
              targetWithMostVotesId,
            ),
      ]);
    }
  }
}
