import 'reflect-metadata';
import { Injectable } from '../di/injectable.decorator';

export const GATEWAY_METADATA = 'websocket_gateway';
export const PATTERN_METADATA = 'websocket_pattern';
export const MESSAGE_MAPPING_METADATA = 'websocket_message_mapping';
export const WS_SERVER_METADATA = 'websocket_server';

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

/**
 * Injects the WebSocket server instance into a property.
 * Used inside a @WebSocketGateway() class.
 *
 * @example
 * ```ts
 * @WebSocketGateway()
 * export class ChatGateway {
 *   @WebSocketServer()
 *   server!: WsServer;
 * }
 * ```
 */
export function WebSocketServer(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(WS_SERVER_METADATA, propertyKey, target.constructor);
  };
}

/**
 * Type for the WebSocket server instance.
 * Provides methods for managing connected clients.
 */
export interface WsServer {
  /** Publish data to a specific topic/channel */
  publish(topic: string, data: string | BufferSource): void;
  /** Number of connected subscribers for a topic */
  subscriberCount(topic: string): number;
}
