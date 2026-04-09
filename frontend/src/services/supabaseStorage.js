const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.REACT_APP_SUPABASE_STORAGE_BUCKET || 'blogsy-media';

const isSupabaseStorageConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const sanitizeFileName = (name = 'file') =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const inferFileType = (mimeType = '') => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
};

const getBinaryFile = (item) => item?.rawFile || item;

export const uploadFilesToSupabaseStorage = async (files = [], userId = 'anonymous') => {
  if (!files.length) return [];

  if (!isSupabaseStorageConfigured()) {
    return null;
  }

  const uploaded = [];

  for (const item of files) {
    const file = getBinaryFile(item);
    if (!(file instanceof Blob)) {
      throw new Error('Invalid file payload for upload. Please re-select media files and try again.');
    }

    const safeName = sanitizeFileName(file.name || 'file');
    const objectPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${objectPath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'false',
      },
      body: file,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Supabase upload failed (${response.status}): ${details || 'Unknown error'}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${objectPath}`;

    uploaded.push({
      url: publicUrl,
      fileType: inferFileType(file.type),
      storage_provider: 'supabase',
      storage_path: objectPath,
      name: file.name || item?.name,
    });
  }

  return uploaded;
};
