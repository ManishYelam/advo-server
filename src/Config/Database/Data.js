const databases = ['MAIN'];

const DATABASE_KEYS = ['MAIN_DB_NAME'];

const prefixes = { main: 'MEDSRV' };

const departmentMapping = { MEDSRV: 'MAIN' };

const DEPARTMENTS = { MAIN: 'Main' };

const paths = { MAIN: '../../Api/Models/Association' };

const fileCategories = {
  images: ['image/jpeg', 'image/png', 'image/gif'],
  videos: ['video/mp4', 'video/mkv'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  presentations: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  textFiles: ['text/plain'],
  csvFiles: ['text/csv'],
};

const sizeLimits = {
  smallest: 1 * 1024 * 1024, // 1 MB - Profile pictures, small text files
  smaller: 5 * 1024 * 1024, // 5 MB - Small PDFs, single images
  small: 10 * 1024 * 1024, // 10 MB - Multi-page PDFs, detailed spreadsheets
  medium: 50 * 1024 * 1024, // 50 MB - Large presentations, video clips
  large: 500 * 1024 * 1024, // 500 MB - HD videos, large archives
  larger: 1 * 1024 * 1024 * 1024, // 1 GB - Full-length videos, scientific datasets
  extraLarge: 2 * 1024 * 1024 * 1024, // 2 GB - Extended videos, high-resolution images
  extraLargeer: 3 * 1024 * 1024 * 1024, // 3 GB - Large datasets, complex media projects
  extraLargest: 4 * 1024 * 1024 * 1024, // 4 GB - Full media libraries, high-definition videos
  largest: 5 * 1024 * 1024 * 1024, // 5 GB - Machine learning datasets, enterprise media projects
};

module.exports = {
  databases,
  prefixes,
  departmentMapping,
  DEPARTMENTS,
  paths,
  DATABASE_KEYS,
  fileCategories,
  sizeLimits,
};
