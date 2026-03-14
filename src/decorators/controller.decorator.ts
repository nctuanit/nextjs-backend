import 'reflect-metadata';
import { Injectable } from '../di/injectable.decorator';

import { CONTROLLER_WATERMARK, PATH_METADATA } from '../constants';

export function Controller(prefix: string = ''): ClassDecorator {
  return (target: Function) => {
    Injectable()(target);
    Reflect.defineMetadata(CONTROLLER_WATERMARK, true, target);
    // Ensure prefixes start with / and don't end with / unless it's just /
    const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
    Reflect.defineMetadata(PATH_METADATA, normalizedPrefix, target);
  };
}
