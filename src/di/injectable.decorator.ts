import 'reflect-metadata';

import { INJECTABLE_WATERMARK } from '../constants';

export function Injectable(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);
  };
}
