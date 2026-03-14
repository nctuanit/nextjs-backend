import 'reflect-metadata';
import { Injectable } from '../di/injectable.decorator';

export const GATEWAY_METADATA = 'websocket_gateway';
export const PATTERN_METADATA = 'websocket_pattern';
export const MESSAGE_MAPPING_METADATA = 'websocket_message_mapping';

export interface GatewayOptions {
  path?: string;
  namespace?: string;
}

/**
 * Marks a class as a WebSocket Gateway (socket.io or ws similar architecture).
 */
export function WebSocketGateway(options?: GatewayOptions): ClassDecorator {
  return (target: Function) => {
    Injectable()(target);
    Reflect.defineMetadata(GATEWAY_METADATA, options || {}, target);
  };
}

/**
 * Subscribes to incoming websocket messages that match the specified message/pattern.
 *
 * @param message The message pattern to listen to.
 */
export function SubscribeMessage(message: string): MethodDecorator {
  return (target: object | Function, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(MESSAGE_MAPPING_METADATA, true, descriptor.value);
    Reflect.defineMetadata(PATTERN_METADATA, message, descriptor.value);
    return descriptor;
  };
}
