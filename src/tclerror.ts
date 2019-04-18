export class TclError extends Error {
  /** 
   * Construct a new TclError
   * 
   * @param  {any} ...args
   */
  constructor(...args: any) {
    super(...args);
    this.name = "TclError";
  }
}
