import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { RoleService } from '../../services/roleService';

@injectable()
export class CreateTallyHandler extends MessageHandlerWithHelp {
  private readonly tallyService: TallyService;
  private readonly roleService: RoleService;

  constructor(
    @inject(TYPES.TallyService) tallyService: TallyService,
    @inject(TYPES.RoleService) roleService,
  ) {
    super('createTally', MessageCategory.Tally, 'Admin. Starts a new tally');
    this.tallyService = tallyService;
    this.roleService = roleService;
  }

  async handle(message: Message) {
    if (!message.member?.hasPermission('ADMINISTRATOR')) {
      message.reply('you need to be an admin to use this command');
      return;
    }

    const succeeded = await this.tallyService.createTally(message.guild!);
    if (!succeeded) {
      message.reply(
        "an active tally is already running or you don't have enough players",
      );
      return;
    }

    const playerRole = await this.roleService.createOrGetPlayerRole(
      message.guild!,
    );
    const majority = Math.floor(playerRole.members.array().length / 2) + 1;
    message.channel.send(
      `${playerRole}\n\nA new vote has commenced. Majority is ${majority}.`,
    );
  }
}