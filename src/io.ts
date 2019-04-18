import { TclError } from './tclerror';

export class IO {
  write(channelId: string, string: string) {
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
