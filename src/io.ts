import { TclError } from './tclerror';

/**
 * Class to use to write data raw to console
 *
 * @export
 * @class IO
 */
export class IO {
  /**
   * Write to console
   * 
   * @param {string} channelId - The stream to write to: stdout or stderr
   * @param {string} string - The string to write
   * @memberof IO
   */
  public write(channelId: string, string: string): void {
    switch (channelId) {
      case 'stdout':
        process.stdout.write(string);
        break;
      case 'stderr':
        process.stderr.write(string);
        break;
      default:
        throw new TclError(`can not find channel named "${channelId}"`);
    }
  }
}
