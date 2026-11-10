// jest.setup.js

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/mock/cache/dir',
  DocumentDirectoryPath: '/mock/documents/dir',
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(undefined),
  readDir: jest.fn().mockResolvedValue([]),
  unlink: jest.fn().mockResolvedValue(undefined),
  downloadFile: jest.fn().mockReturnValue({
    promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 }),
    jobId: 1,
  }),
}));

// Mock react-native-background-fetch
jest.mock('react-native-background-fetch', () => ({
  configure: jest.fn((config, callback) => Promise.resolve(2)),
  finish: jest.fn(),
  registerHeadlessTask: jest.fn(),
  status: jest.fn().mockResolvedValue(2),
  start: jest.fn().mockResolvedValue(2),
  stop: jest.fn().mockResolvedValue(2),
  NETWORK_TYPE_NONE: 0,
  NETWORK_TYPE_ANY: 1,
  NETWORK_TYPE_UNMETERED: 2,
  STATUS_RESTRICTED: 0,
  STATUS_DENIED: 1,
  STATUS_AVAILABLE: 2,
}));

// Mock react-native-screen-capture
jest.mock('react-native-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
  addScreenshotListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  disallowScreenshot: jest.fn(),
  keepAwake: jest.fn(),
}));
