import type { DocumentPickerResponse } from 'react-native-document-picker';

import { env } from '@/config/env';
import { getToken } from './tokenStorage';

type UploadFields = Record<string, string | number | boolean | undefined | null>;

type UploadProgramPayload = {
  file: DocumentPickerResponse;
  fields: UploadFields;
};

const DEBUG_UPLOAD = __DEV__;

export const uploadProgramFile = async ({ file, fields }: UploadProgramPayload) => {
  const url = `${env.API_BASE_URL}/api/programs/upload`;
  const token = await getToken();

  const formData = new FormData();
  formData.append('programFile', {
    uri: file.uri,
    name: file.name ?? 'program-upload',
    type: file.type ?? 'application/octet-stream',
  } as any);

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
  });

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (DEBUG_UPLOAD) {
    console.log('[UPLOAD] POST /api/programs/upload', {
      hasToken: !!token,
      fileName: file.name,
      fileType: file.type,
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage =
      payload?.error || payload?.message || response.statusText || 'Upload failed';
    throw new Error(errorMessage);
  }

  return payload;
};
