import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promoteFile } from '../../apps/mobile/src/platform/files/promote-file.ts';

test('Expo move changes stage URI: successful promotion retains destination; failed staging cleans only its own temporary file', async () => {
  const files = new Set<string>(),
    stage = {
      uri: 'temporary',
      get exists() {
        return files.has(this.uri);
      },
      delete() {
        files.delete(this.uri);
      },
    };
  await promoteFile(
    stage,
    async () => {
      files.add('temporary');
    },
    () => {
      files.delete('temporary');
      files.add('destination');
      stage.uri = 'destination';
    },
  );
  assert.equal(files.has('destination'), true);
  const failed = {
    uri: 'failed-stage',
    get exists() {
      return files.has(this.uri);
    },
    delete() {
      files.delete(this.uri);
    },
  };
  await assert.rejects(
    () =>
      promoteFile(
        failed,
        async () => {
          files.add(failed.uri);
          throw Error('synthetic disk full');
        },
        () => {
          throw Error('unreachable');
        },
      ),
    /disk full/,
  );
  assert.equal(files.has('failed-stage'), false);
  assert.equal(files.has('destination'), true);
});
