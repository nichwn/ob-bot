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

@injectable()
export class VoteHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;

  constructor(@inject(TYPES.TallyService) tallyService: TallyService) {
    super(
      'vote',
      MessageCategory.Vote,
      'Casts a vote for the mentioned player',
    );
    this.tallyService = tallyService;
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
    }
  }
}
