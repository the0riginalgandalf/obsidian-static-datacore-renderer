export class StartBlockNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StartBlockNotFoundError";
  }
}

export class EndBlockNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EndBlockNotFoundError";
  }
}
