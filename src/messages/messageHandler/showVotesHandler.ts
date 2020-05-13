import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { NoActiveTallyError } from '../../exceptions';
import { EmbedHelper } from '../embedHelper';

@injectable()
export class ShowVotesHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly embedHelper: EmbedHelper;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.EmbedHelper) embedHelper: EmbedHelper,
  ) {
    super('showVotes', MessageCategory.Vote, 'Shows casted votes');
    this.tallyService = tallyService;
    this.embedHelper = embedHelper;
  }

  async handle(message: Message) {
    try {
      const [votes, notVoted] = await this.tallyService.votes(message.guild!);

      const response = await this.embedHelper.makeTallyEmbed(
        message.guild!,
        votes,
        notVoted,
      );

      await message.channel.send(response);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active.';
      } else {
        response = 'something went wrong. Try again later.';
      }

      await message.reply(response);
    }
  }
}
