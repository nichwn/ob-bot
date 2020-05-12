import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import {
  NoCastedVoteError,
  VoterDoesNotExistError,
  NoActiveTallyError,
} from '../../exceptions';

@injectable()
export class UnvoteHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;

  constructor(@inject(TYPES.TallyService) tallyService: TallyService) {
    super('unvote', MessageCategory.Vote, 'Clears a casted vote');
    this.tallyService = tallyService;
  }

  async handle(message: Message) {
    try {
      this.tallyService.unvote(message.guild!, message.author);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active.';
      } else if (e instanceof VoterDoesNotExistError) {
        response = 'you cannot unvote.';
      } else if (e instanceof NoCastedVoteError) {
        response = "you haven't casted a vote.";
      } else {
        response = 'something went wrong. Try again later.';
      }

      message.reply(response);
    }
  }
}
