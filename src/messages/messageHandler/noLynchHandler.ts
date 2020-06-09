import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { VoteHelper } from '../voteHelper';

@injectable()
export class NoLynchHandler extends MessageHandlerWithHelp {
  private readonly voteHelper: VoteHelper;

  constructor(@inject(TYPES.VoteHelper) voteHelper: VoteHelper) {
    super('noLynch', MessageCategory.Vote, 'Casts a vote for No Lynch');
    this.voteHelper = voteHelper;
  }

  async handle(message: Message) {
    await this.voteHelper.vote(message, message.author, 'NO_LYNCH');
  }
}
