// Shared Essentia singleton for core analyzers
let instance: any | null = null;
let loader: Promise<any> | null = null;

export async function getEssentiaInstance(): Promise<any> {
  if (instance) return instance;
  if (!loader) {
    loader = (async () => {
      const mod: any = await import("essentia.js");
      const e = new mod.Essentia(mod.EssentiaWASM);
      return e;
    })();
  }
  instance = await loader;
  return instance;
}
