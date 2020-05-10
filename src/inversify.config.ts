import { Container } from 'inversify';
import { TYPES } from './types';
import { Bot } from './bot';
import { Client } from 'discord.js';
import { MessageResponder } from './messages/messageResponder';
import { HelpHandler } from './messages/messageHandler/helpHandler';
import { EchoHandler } from './messages/messageHandler/echoHandler';
import { discordAuthToken } from './utils/environment';
import {
  MessageHandler,
  MessageHandlerWithHelp,
} from './messages/messageHandler/messageHandler';
import { DataProxy } from './proxies/dataProxy';
import { RoleService } from './services/roleService';

const container = new Container();

container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<DataProxy>(TYPES.DataProxy).to(DataProxy);
container.bind<MessageHandler>(TYPES.MessageHandler).to(EchoHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(HelpHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(EchoHandler);
container.bind<MessageResponder>(TYPES.MessageResponder).to(MessageResponder);
container.bind<RoleService>(TYPES.RoleService).to(RoleService);
container.bind<string>(TYPES.Token).toConstantValue(discordAuthToken);

export default container;
