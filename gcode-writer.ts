import { Coordinates } from "./types/coordinates";
import { FeedRate } from "./types/feed-rate";

export class GcodeWriter {
  private readonly gcodeLines: string[] = [];
  private lastFeedRate: FeedRate | null = null;
  private readonly lastCoordinates: Required<Coordinates> = {
      X: 0,
      Y: 0,
      Z: 0
  };

  constructor (private readonly feedRates: { [key in FeedRate]: number }, public readonly safeLocation: Coordinates) {
      this.setFeedRate('standard');
  }

  public move(coordinates: Coordinates, feedRate: FeedRate = 'standard', comment?: string) {
      this.setFeedRate(feedRate);
      
      let code: string;
      switch(feedRate) {
          case 'standard':
              code = 'G1';
              break;
          case 'rapid':
              code = 'G0';
              break;
          default:
              throw new Error(`MovementType '${feedRate}' not implemented.`);
      }

      let line = code;
      for (const key of Object.keys(coordinates) as (keyof Coordinates)[]) {
          const value = coordinates[key] as number;
          line = `${line} ${key}${value}`;
          this.lastCoordinates[key] = value;
      }

      this.add(line, comment);
  }

  public feed(coordinates: Coordinates, comment?: string): void {
      this.move(coordinates, "standard", comment);
  }

  public rapid(coordinates: Coordinates, comment?: string): void {
      this.move(coordinates, "rapid", comment);
  }

  public waitForUser(comment?: string): void {
      this.add("M0", comment);
  }

  public moveToSafety(): void {
      this.safeHeight();
      this.move( {
          X: this.safeLocation.X,
          Y: this.safeLocation.Y,
      }, "rapid", "Moving to safe location");
  }

  public rotate(angle: number): void {
    this.add(`G1 A${angle}`, `Draaien ${angle}`);
  }

  public safeHeight(): void {
      this.move( { Z: this.safeLocation.Z }, "rapid", "Safe height");
  }

  public generate(): string {
      let output = '';

      for(const line of this.gcodeLines) {
          output += `${line}\r\n`;
      }

      return output;
  }

  public getCurrentCoordinates(): Required<Coordinates> {
      return {
          ...this.lastCoordinates
      };
  }

  private setFeedRate(feedRate: FeedRate): void {
      if (this.lastFeedRate === feedRate) {
          return;
      }
      const rate = this.feedRates[feedRate];
      this.add(`F${rate} ; ${feedRate}`)
      this.lastFeedRate = feedRate;
  }

  private add(line: string, comment?: string): void {
      if (!!comment) {
          line = `${line} ; ${comment}`;
      }
      this.gcodeLines.push(line);
  }
}