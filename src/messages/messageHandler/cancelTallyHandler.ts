import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { RoleService } from '../../services/roleService';
import { NoActiveTallyError } from '../../exceptions';

@injectable()
export class CancelTallyHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly roleService: RoleService;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.RoleService) roleService,
  ) {
    super(
      'cancelTally',
      MessageCategory.Tally,
      'Admin. Cancels the current tally',
    );
    this.tallyService = tallyService;
    this.roleService = roleService;
  }

  async handle(message: Message) {
    if (!message.member?.hasPermission('ADMINISTRATOR')) {
      message.reply('you need to be an admin to use this command');
      return;
    }

    try {
      this.tallyService.cancelTally(message.guild!);
    } catch (e) {
      let response = '';
      if (e instanceof NoActiveTallyError) {
        response = 'no tally is currently active';
      } else {
        response = 'something went wrong. Try again later.';
      }

      message.reply(response);
      return;
    }

    const playerRole = await this.roleService.createOrGetPlayerRole(
      message.guild!,
    );
    message.channel.send(`${playerRole}\nThe current vote has been cancelled.`);
  }
}
