import { createServer } from 'node:http';
import { loadEnvFile } from 'node:process';
import handler from '../api/tmdb.ts';

// 現在の.envにあるAPIキーをテスト用に読み込む
loadEnvFile('.env');

const server = createServer((req, res) => {
  void handler(req, res);
});

server.listen(3001, () => {
  console.log('テストサーバー起動: http://localhost:3001');
});
