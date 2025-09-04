export abstract class Entity<T> {
  protected props: T;

  constructor(props: T) {
    this.props = props;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return false; // Em uma implementação real, compararíamos os IDs
  }
}