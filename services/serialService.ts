import { SerialConfig } from "../types";

// Type definition for Web Serial API
interface SerialPort {
  open(options: { baudRate: number, dataBits?: number, stopBits?: number, parity?: string }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream;
}

interface NavigatorWithSerial extends Navigator {
  serial: {
    requestPort(options?: { filters: any[] }): Promise<SerialPort>;
  };
}

export class ScaleConnection {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private isReading: boolean = false;
  private onWeightCallback: (weight: number) => void;

  constructor(onWeight: (weight: number) => void) {
    this.onWeightCallback = onWeight;
  }

  async connect(config: SerialConfig) {
    if (!('serial' in navigator)) {
      throw new Error("Web Serial API not supported in this browser.");
    }

    try {
      this.port = await (navigator as unknown as NavigatorWithSerial).serial.requestPort();
      await this.port.open({
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity
      });
      
      this.isReading = true;
      this.readLoop();
    } catch (error) {
      console.error("Error connecting to scale:", error);
      throw error;
    }
  }

  async disconnect() {
    this.isReading = false;
    if (this.reader) {
      await this.reader.cancel();
    }
    if (this.port) {
      await this.port.close();
    }
    this.port = null;
  }

  private async readLoop() {
    if (!this.port || !this.port.readable) return;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    this.reader = reader;

    let buffer = "";

    try {
      while (this.isReading) {
        const { value, done } = await reader.read();
        if (done) {
          break; // Stream has closed
        }
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          // Process all complete lines
          buffer = lines.pop() || ""; // Keep the last incomplete fragment

          for (const line of lines) {
            this.parseScaleString(line);
          }
        }
      }
    } catch (error) {
      console.error("Read error:", error);
    } finally {
      reader.releaseLock();
    }
  }

  // Basic heuristic parser for scale strings.
  // Many scales output formats like: "ST,GS,+  20340 kg" or "   1500"
  // We extract the largest numeric sequence.
  private parseScaleString(line: string) {
    // Regex to find numbers, allowing for decimals and optional +/- sign
    const match = line.match(/[+-]?\d+(\.\d+)?/g);
    if (match) {
        // Find the number that looks most like a weight (usually the longest or last one)
        // This is a simplification; production apps need exact scale protocol specs.
        const potentialWeights = match.map(n => parseFloat(n));
        const weight = potentialWeights.reduce((max, current) => (current > max ? current : max), 0);
        
        if (!isNaN(weight)) {
            this.onWeightCallback(weight);
        }
    }
  }
}