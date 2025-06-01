import mongoose from "mongoose";

declare global {
  // Adiciona mongoose ao escopo global com tipagem correta
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

export {};
