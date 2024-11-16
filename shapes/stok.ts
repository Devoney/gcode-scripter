export class Stok {
  constructor(public readonly dikte: number, public readonly lengte: number) {

  }

  public get omtrek(): number {
      return Math.PI * this.dikte;
  }
}