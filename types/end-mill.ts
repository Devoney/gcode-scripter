export class EndMill {
  public readonly radius: number;

  constructor(public readonly diameter: number) {
      this.radius = diameter / 2;
  }
}