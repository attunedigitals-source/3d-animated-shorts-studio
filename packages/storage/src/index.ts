/**
 * @studio/storage
 * Provider-agnostic object storage interface.
 */

export interface StorageUploadOptions {
  bucket: string;
  path: string;
  contentType: string;
  data: Buffer | Uint8Array;
}

export interface StorageUploadResult {
  url: string;
  key: string;
  sizeBytes: number;
}

export interface IStorageAdapter {
  upload(options: StorageUploadOptions): Promise<StorageUploadResult>;
  download(bucket: string, key: string): Promise<Buffer>;
  delete(bucket: string, key: string): Promise<void>;
  getPublicUrl(bucket: string, key: string): string;
}

