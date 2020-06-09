import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { VoteHelper } from '../voteHelper';

@injectable()
export class VoteHandler extends MessageHandlerWithHelp {
  private readonly voteHelper: VoteHelper;

  constructor(@inject(TYPES.VoteHelper) voteHelper: VoteHelper) {
    super(
      'vote',
      MessageCategory.Vote,
      'Casts a vote for the mentioned player',
    );
    this.voteHelper = voteHelper;
  }

  async handle(message: Message) {
    const voter = message.author;
    const targets = message.mentions.users.array();

    if (targets.length === 0) {
      await message.reply('mention the player you wish to vote for.');
      return;
    } else if (targets.length > 1) {
      await message.reply('you can only vote for 1 player at a time.');
      return;
    }

    await this.voteHelper.vote(message, voter, targets[0]);
  }
}
