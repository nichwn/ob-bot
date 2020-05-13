import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { RoleService } from '../../services/roleService';
import { InsufficientPlayersError, ActiveTallyError } from '../../exceptions';
import { EmbedHelper } from '../embedHelper';

@injectable()
export class CreateTallyHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly roleService: RoleService;
  private readonly embedHelper: EmbedHelper;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.RoleService) roleService,
    @inject(TYPES.EmbedHelper) embedHelper: EmbedHelper,
  ) {
    super('createTally', MessageCategory.Tally, 'Admin. Starts a new tally');
    this.tallyService = tallyService;
    this.roleService = roleService;
    this.embedHelper = embedHelper;
  }

  async handle(message: Message) {
    if (!message.member?.hasPermission('ADMINISTRATOR')) {
      message.reply('you need to be an admin to use this command');
      return;
    }

    try {
      await this.tallyService.createTally(message.guild!);
    } catch (e) {
      let response = '';
      if (e instanceof ActiveTallyError) {
        response = 'a tally is already running.';
      } else if (e instanceof InsufficientPlayersError) {
        response = 'more players are needed before a tally can be started.';
      } else {
        response = 'something went wrong. Try again later.';
      }

      message.reply(response);
      return;
    }

    const playerRole = await this.roleService.createOrGetPlayerRole(
      message.guild!,
    );
    message.channel.send(`${playerRole}\nA new vote has commenced.`);

    try {
      const [votes, notVoted] = this.tallyService.votes(message.guild!);

      const tallyEmbed = await this.embedHelper.makeTallyEmbed(
        message.guild!,
        votes,
        notVoted,
      );
      message.channel.send(tallyEmbed);
    } catch (e) {
      message.reply('something went wrong. Try again later.');
    }
  }
}
