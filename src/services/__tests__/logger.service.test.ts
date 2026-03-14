import { describe, expect, test, spyOn, afterEach } from 'bun:test';
import { ConsoleLogger, Logger } from '../logger.service';

describe('LoggerService', () => {
  afterEach(() => {
    // Reset mocks
  });

  describe('ConsoleLogger', () => {
    test('should log messages to console.log', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
      const logger = new ConsoleLogger('TestContext');
      
      logger.log('Hello world');
      expect(consoleSpy).toHaveBeenCalled();
      const lastCall = consoleSpy.mock.calls[0]![0] as string;
      expect(lastCall).toContain('Hello world');
      expect(lastCall).toContain('LOG');
      expect(lastCall).toContain('TestContext');
      
      consoleSpy.mockRestore();
    });

    test('should log errors and traces to console.error when provided', () => {
      const consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
      
      const logger = new ConsoleLogger('ErrorContext');
      logger.error('Oops something went wrong', 'Trace stack here');
      
      expect(consoleLogSpy).toHaveBeenCalled(); // ERROR is printed using printMessage -> console.log
      expect(consoleErrorSpy).toHaveBeenCalled(); // Trace is printed using console.error
      
      const logCall = consoleLogSpy.mock.calls[0]![0] as string;
      expect(logCall).toContain('Oops something went wrong');
      expect(logCall).toContain('ERROR');
      
      const errCall = consoleErrorSpy.mock.calls[0]![0] as string;
      expect(errCall).toContain('Trace stack here');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('should format object messages correctly', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
      const logger = new ConsoleLogger('ObjContext');
      
      logger.log({ foo: 'bar', id: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      
      const logCall = consoleSpy.mock.calls[0]![0] as string;
      expect(logCall).toContain('{\n  "foo": "bar",\n  "id": 1\n}');
      
      consoleSpy.mockRestore();
    });

    test('should emit warnings and debug prints correctly', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
      const logger = new ConsoleLogger();
      
      logger.warn('Warning here');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect((consoleSpy.mock.calls[0]![0] as string)).toContain('WARN');

      logger.debug('Debug here');
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect((consoleSpy.mock.calls[1]![0] as string)).toContain('DEBUG');

      logger.verbose('Verbose here');
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect((consoleSpy.mock.calls[2]![0] as string)).toContain('VERBOSE');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Global Static Logger', () => {
    test('static methods should trigger underlying logger', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      Logger.log('Static log', 'GlobalContext');
      expect(consoleSpy).toHaveBeenCalled();
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1]![0] as string;
      expect(lastCall).toContain('Static log');
      expect(lastCall).toContain('GlobalContext');
      
      consoleSpy.mockRestore();
    });

    test('instance of static logger should proxy correctly', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
      
      const logger = new Logger('InstanceProxy');
      logger.warn('Warning via proxy');
      
      const lastCall = consoleSpy.mock.calls[0]![0] as string;
      expect(lastCall).toContain('Warning via proxy');
      expect(lastCall).toContain('InstanceProxy');
      expect(lastCall).toContain('WARN');
      
      consoleSpy.mockRestore();
    });
  });
});
