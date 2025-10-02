const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './server.js',
  target: 'node', // Optimized for Node.js
  externals: [nodeExternals()], // Exclude node_modules from bundling
  externalsPresets: { node: true },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'final.js',
  },
  optimization: {
    minimize: true, // Reduces output file size
  },
  plugins: [
    new CleanWebpackPlugin(),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            { source: 'UPLOAD_DIR', destination: 'dist/UPLOAD_DIR' },
            { source: '.env', destination: 'dist/.env' },
            { source: 'package.json', destination: 'dist/package.json' },
            { source: 'package-lock.json', destination: 'dist/package-lock.json' },
          ],
        },
      },
    }),
  ],
};
