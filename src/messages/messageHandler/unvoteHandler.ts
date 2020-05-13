import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import {
  NoCastedVoteError,
  UserIsNotAPlayerError,
  NoActiveTallyError,
} from '../../exceptions';
import { EmbedHelper } from '../embedHelper';

@injectable()
export class UnvoteHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly embedHelper: EmbedHelper;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.EmbedHelper) embedHelper: EmbedHelper,
  ) {
    super('unvote', MessageCategory.Vote, 'Clears a casted vote');
    this.tallyService = tallyService;
    this.embedHelper = embedHelper;
  }

  async handle(message: Message) {
    try {
      await this.tallyService.unvote(message.guild!, message.author);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active.';
      } else if (e instanceof UserIsNotAPlayerError) {
        response = 'only players can unvote.';
      } else if (e instanceof NoCastedVoteError) {
        response = "you haven't casted a vote.";
      } else {
        response = 'something went wrong. Try again later.';
      }

      await message.reply(response);
      return;
    }

    try {
      const [votes, notVoted] = await this.tallyService.votes(message.guild!);

      const tallyEmbed = await this.embedHelper.makeTallyEmbed(
        message.guild!,
        votes,
        notVoted,
      );
      await message.channel.send(tallyEmbed);
    } catch (e) {
      await message.reply('something went wrong. Try again later.');
    }
  }
}
