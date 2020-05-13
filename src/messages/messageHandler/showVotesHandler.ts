import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { UserIsNotAPlayerError, NoActiveTallyError } from '../../exceptions';
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
      const [votes, notVoted] = this.tallyService.votes(
        message.guild!,
        message.author,
      );

      const response = await this.embedHelper.makeTallyEmbed(
        message.guild!,
        votes,
        notVoted,
      );

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
}
