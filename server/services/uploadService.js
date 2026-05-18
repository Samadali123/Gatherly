const ImageKit = require('imagekit');
const config = require('../configs');

const imagekit = new ImageKit({
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

const allowedTypes = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
};

const ensureImageKitConfigured = () => {
  if (!config.IMAGEKIT_PUBLIC_KEY || !config.IMAGEKIT_PRIVATE_KEY || !config.IMAGEKIT_URL_ENDPOINT) {
    const error = new Error('ImageKit is not configured');
    error.statusCode = 500;
    throw error;
  }
};

const getAttachmentType = (mimeType) => {
  if (allowedTypes.image.includes(mimeType)) {
    return 'image';
  }

  if (allowedTypes.video.includes(mimeType)) {
    return 'video';
  }

  if (allowedTypes.document.includes(mimeType)) {
    return 'document';
  }

  if (allowedTypes.audio.includes(mimeType)) {
    return 'audio';
  }

  return null;
};

const assertUploadRules = ({ files, requestedType }) => {
  if (!files?.length) {
    const error = new Error('Please select a file to upload');
    error.statusCode = 400;
    throw error;
  }

  if (requestedType === 'image' && files.length > 6) {
    const error = new Error('You can upload up to 6 images at once');
    error.statusCode = 400;
    throw error;
  }

  if ((requestedType === 'video' || requestedType === 'document' || requestedType === 'audio') && files.length > 1) {
    const error = new Error('Videos, documents, and recordings can be uploaded one at a time');
    error.statusCode = 400;
    throw error;
  }

  files.forEach((file) => {
    const detectedType = getAttachmentType(file.mimetype);

    if (!detectedType || detectedType !== requestedType) {
      const error = new Error(`Unsupported ${requestedType} file type`);
      error.statusCode = 400;
      throw error;
    }
  });
};

const getImageKitFolder = (folder) => `/${folder.replace(/^\/+|\/+$/g, '')}`;

const uploadFile = async ({ file, folder, type }) => {
  const result = await imagekit.upload({
    file: file.buffer,
    fileName: file.originalname,
    folder: getImageKitFolder(folder),
    useUniqueFileName: true,
    tags: ['gatherly', type],
  });

  return {
    type,
    url: result.url,
    mimeType: file.mimetype,
    name: file.originalname,
    size: file.size,
  };
};

const uploadAttachments = async ({ files, type, folder }) => {
  ensureImageKitConfigured();
  assertUploadRules({ files, requestedType: type });

  return Promise.all(files.map((file) => uploadFile({ file, folder, type })));
};

const uploadAvatar = async ({ file, folder }) => {
  ensureImageKitConfigured();
  assertUploadRules({ files: [file], requestedType: 'image' });

  const uploaded = await uploadFile({ file, folder, type: 'image' });
  return uploaded.url;
};

module.exports = {
  uploadAttachments,
  uploadAvatar,
};
