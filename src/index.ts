import 'dotenv/config';
import 'reflect-metadata';

import container from './inversify.config';
import { TYPES } from './types';
import { Bot } from './bot';

const bot = container.get<Bot>(TYPES.Bot);
bot
  .listen()
  .then(() => {
    console.log('Logged in!');
  })
  .catch((error) => {
    console.log('Oh no! ', error);
  });
