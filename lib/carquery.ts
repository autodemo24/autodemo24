// Helper per chiamare CarQueryAPI (https://www.carqueryapi.com/api/0.3/).
// L'API blocca le richieste server-to-server (403) ma supporta JSONP: usiamo
// uno <script> dinamico con un callback globale temporaneo.

const BASE_URL = 'https://www.carqueryapi.com/api/0.3/';

interface Make {
  make_id?: string;
  make_display?: string;
}

interface Model {
  model_name?: string;
}

interface MakesResponse { Makes?: Make[] }
interface ModelsResponse { Models?: Model[] }

function jsonp<T>(params: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const cbName = `__cq_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const qs = new URLSearchParams({ ...params, callback: cbName });
    const url = `${BASE_URL}?${qs.toString()}`;
    const script = document.createElement('script');

    const cleanup = () => {
      // @ts-expect-error callback globale dinamico
      delete window[cbName];
      script.remove();
    };

    // @ts-expect-error callback globale dinamico
    window[cbName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('CarQueryAPI: errore di rete'));
    };

    script.src = url;
    document.head.appendChild(script);
  });
}

export async function getMakesByYear(year: string | number): Promise<string[]> {
  const data = await jsonp<MakesResponse>({ cmd: 'getMakes', year: String(year) });
  const list = (data.Makes ?? [])
    .map((m) => m.make_display?.trim() ?? '')
    .filter(Boolean);
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'it'));
}

export async function getModelsByMakeYear(make: string, year: string | number): Promise<string[]> {
  const data = await jsonp<ModelsResponse>({
    cmd: 'getModels',
    make: make.toLowerCase(),
    year: String(year),
  });
  const list = (data.Models ?? [])
    .map((m) => m.model_name?.trim() ?? '')
    .filter(Boolean);
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'it'));
}
