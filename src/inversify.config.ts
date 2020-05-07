import { Container } from 'inversify';
import { TYPES } from './types';
import { Bot } from './bot';
import { Client } from 'discord.js';
import { MessageResponder } from './services/messageResponder';
import { Echo } from './services/echo';
import { MessageHandler } from './services/messageHandler';

const container = new Container();

container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<MessageHandler>(TYPES.MessageHandler).to(Echo);
container.bind<MessageResponder>(TYPES.MessageResponder).to(MessageResponder);
container.bind<string>(TYPES.Token).toConstantValue(process.env.TOKEN!);

export default container;
