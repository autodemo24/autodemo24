export type SpediamoEnv = 'staging' | 'production';

export function getApiBase(env: SpediamoEnv): string {
  return env === 'production'
    ? 'https://core.spediamopro.com/api/v2'
    : 'https://core.spediamopro.it/api/v2';
}
