import { Injectable } from '../di/injectable.decorator';
import { Type as T, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { Logger } from '../services/logger.service';

export interface ConfigModuleOptions {
  /**
   * TypeBox schema to validate process.env
   */
  schema?: TSchema;
  /**
   * Optional custom config object. If not provided, process.env is used.
   */
  load?: Record<string, string>;
}

@Injectable()
export class ConfigService<Config = Record<string, string>> {
  private config: Config;
  private readonly logger = new Logger('ConfigService');

  constructor(options?: ConfigModuleOptions) {
    const rawConfig = options?.load || process.env;

    if (options?.schema) {
      try {
        const copy = { ...rawConfig };
        
        // Convert strings to correct primitives (e.g "3000" -> 3000, "true" -> true)
        Value.Convert(options.schema, copy);
        
        // Apply default values defined in the schema
        const defaulted = Value.Default(options.schema, copy) as any;
        
        // Validate and decode
        const decoded = Value.Decode(options.schema, defaulted);
        
        this.config = (decoded || defaulted) as Config;
      } catch (error: any) {
        this.logger.error('Environment validation failed!');
        
        // Print detailed TypeBox errors
        const errors = [...Value.Errors(options.schema, rawConfig)];
        errors.forEach(err => {
            this.logger.error(`- Property '${err.path}' ${err.message}`);
        });
        
        throw new Error('Config validation error');
      }
    } else {
      this.config = rawConfig as unknown as Config;
    }
  }

  /**
   * Get a configuration value by key
   */
  get<T = string>(key: keyof Config): T | undefined;
  get<T = string>(key: keyof Config, defaultValue: T): T;
  get<T = string>(key: keyof Config, defaultValue?: T): T | undefined {
    const value = this.config[key];
    if (value !== undefined) {
      return value as unknown as T;
    }
    return defaultValue;
  }

  /**
   * Get a configuration value asserting it exists
   */
  getOrThrow<T = string>(key: keyof Config): T {
    const value = this.config[key];
    if (value === undefined) {
      throw new Error(`Configuration key "${String(key)}" does not exist`);
    }
    return value as unknown as T;
  }
}
