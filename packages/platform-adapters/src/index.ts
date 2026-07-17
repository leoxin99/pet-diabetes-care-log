export interface KeyValueStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class BrowserStorageAdapter implements KeyValueStorageAdapter {
  constructor(private readonly storage: Storage) {}

  async getItem(key: string) {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string) {
    this.storage.setItem(key, value);
  }

  async removeItem(key: string) {
    this.storage.removeItem(key);
  }
}

export interface WeappStorageApi {
  getStorage<T>(options: { key: string }): Promise<{ data: T }>;
  setStorage(options: { key: string; data: string }): Promise<unknown>;
  removeStorage(options: { key: string }): Promise<unknown>;
}

export class WeappStorageAdapter implements KeyValueStorageAdapter {
  constructor(private readonly api: WeappStorageApi) {}

  async getItem(key: string) {
    try {
      const result = await this.api.getStorage<string>({ key });
      return typeof result.data === "string" ? result.data : null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string) {
    await this.api.setStorage({ key, data: value });
  }

  async removeItem(key: string) {
    await this.api.removeStorage({ key });
  }
}
