export class TclError extends Error {
  /** 
   * Construct a new TclError
   * 
   * @param  {any} ...args
   */
  public constructor(...args: any) {
    super(...args);
    this.name = "TclError";
  }
}
