import { injectable, inject } from 'inversify';
import { MessageHandlerWithHelp, MessageCategory } from './messageHandler';
import { Message } from 'discord.js';
import { TYPES } from '../../types';
import { TallyService } from '../../services/tallyService';
import { RoleService } from '../../services/roleService';
import { InsufficientPlayersError, ActiveTallyError } from '../../exceptions';
import { EmbedHelper } from '../embedHelper';
import { compareCaseInsensitive } from '../../utils/compare';

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
    super(
      'createTally',
      MessageCategory.Tally,
      'Admin. Starts a new tally. Specify majority/supermajority required.',
    );
    this.tallyService = tallyService;
    this.roleService = roleService;
    this.embedHelper = embedHelper;
  }

  async handle(message: Message) {
    if (!message.member?.hasPermission('ADMINISTRATOR')) {
      await message.reply('you need to be an admin to use this command');
      return;
    }

    const commandProvided = message.content.split(' ');
    if (commandProvided.length < 2) {
      await message.reply('must specify majority/supermajority');
      return;
    }

    let majorityType: 'MAJORITY' | 'SUPERMAJORITY';
    const majoritySpecified = commandProvided[1];
    if (compareCaseInsensitive(majoritySpecified, 'MAJORITY') === 0) {
      majorityType = 'MAJORITY';
    } else if (
      compareCaseInsensitive(majoritySpecified, 'SUPERMAJORITY') === 0
    ) {
      majorityType = 'SUPERMAJORITY';
    } else {
      await message.reply(
        'must specify majority/supermajority immediately after the command',
      );
      return;
    }

    try {
      await this.tallyService.createTally(message.guild!, majorityType);
    } catch (e) {
      let response = '';
      if (e instanceof ActiveTallyError) {
        response = 'a tally is already running.';
      } else if (e instanceof InsufficientPlayersError) {
        response = 'more players are needed before a tally can be started.';
      } else {
        throw e;
      }

      await message.reply(response);
      return;
    }

    const playerRole = await this.roleService.createOrGetPlayerRole(
      message.guild!,
    );
    await message.channel.send(`${playerRole}\nA new vote has commenced.`);

    const voteStatus = await this.tallyService.votes(message.guild!);

    const tallyEmbed = await this.embedHelper.makeTallyEmbed(
      message.guild!,
      voteStatus,
    );
    await message.channel.send(tallyEmbed);
  }
}
