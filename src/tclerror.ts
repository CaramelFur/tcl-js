export class TclError extends Error {
  /**
   * Creates an instance of TclError.
   * 
   * @param {...any} args
   * @memberof TclError
   */
  public constructor(...args: any) {
    super(...args);
    this.name = "TclError";
  }
}
