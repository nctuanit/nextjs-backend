export type Type<T = any> = new (...args: any[]) => T;

export type InjectionToken = string | symbol | Type<any>;

export interface ClassProvider<T = any> {
  provide: InjectionToken;
  useClass: Type<T>;
}

export interface ValueProvider<T = any> {
  provide: InjectionToken;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  provide: InjectionToken;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: InjectionToken[];
}

export interface ExistingProvider<T = any> {
  provide: InjectionToken;
  useExisting: InjectionToken;
}

export type Provider<T = any> =
  | Type<any>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;
