import { Container } from 'inversify';
import { TYPES } from './types';
import { Bot } from './bot';
import { Client } from 'discord.js';
import { MessageResponder } from './services/messageResponder';
import {
  MessageHandler,
  MessageHandlerWithHelp,
} from './services/messageHandler';
import { HelpHandler } from './services/helpHandler';
import { EchoHandler } from './services/echo';
import { discordAuthToken } from './utils/environment';

const container = new Container();

container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<MessageHandler>(TYPES.MessageHandler).to(EchoHandler);
container.bind<MessageHandler>(TYPES.MessageHandler).to(HelpHandler);
container
  .bind<MessageHandlerWithHelp>(TYPES.MessageHandlerWithHelp)
  .to(EchoHandler);
container.bind<MessageResponder>(TYPES.MessageResponder).to(MessageResponder);
container.bind<string>(TYPES.Token).toConstantValue(discordAuthToken);

export default container;
