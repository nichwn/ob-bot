import { Client } from 'discord.js';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { MessageResponder } from './messages/messageResponder';
import { startSymbol } from './utils/environment';
import { RoleService } from './services/roleService';

@injectable()
export class Bot {
  private client: Client;
  private token: string;
  private messageResponder: MessageResponder;
  private roleService: RoleService;

  constructor(
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.MessageResponder) messageResponder: MessageResponder,
    @inject(TYPES.RoleService) roleService: RoleService,
  ) {
    this.client = client;
    this.token = token;
    this.messageResponder = messageResponder;
    this.roleService = roleService;
  }

  public listen(): Promise<string> {
    this.client.on('ready', () => {
      this.client.user?.setActivity(`${startSymbol}help`);
      this.client.guilds.cache.forEach((guild) => {
        this.roleService.createOrGetPlayerRole(guild);
        this.roleService.createOrGetMajorityOnlyRole(guild);
      });
    });

    this.client.on('guildCreate', (guild) => {
      this.roleService.createOrGetPlayerRole(guild);
      this.roleService.createOrGetMajorityOnlyRole(guild);
    });

    this.client.on('roleDelete', (role) => {
      this.roleService.createOrGetPlayerRole(role.guild);
      this.roleService.createOrGetMajorityOnlyRole(role.guild);
    });

    this.client.on('message', (message) => {
      if (message.author.bot || !message.content.startsWith(startSymbol)) {
        return;
      }
      message.content = message.content.slice(startSymbol.length);

      this.messageResponder.handle(message);
    });

    return this.client.login(this.token);
  }
}
