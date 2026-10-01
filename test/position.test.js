import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPositionDescription } from '../site/core/logbook.js';
import { fixtureFramework } from './helpers/fixtures.js';

const fw = fixtureFramework('logbook');

test('a position description comes from a target alone, essential levels first, using plain level names', () => {
  const pd = buildPositionDescription(fw, {
    name: 'Content lead',
    levels: [
      { code: 'INST', level: 2, priority: 'desirable' },
      { code: 'WRIT', level: 3, priority: 'essential' },
      { code: 'LEAD', level: 6, priority: 'essential' },
    ],
  });
  assert.deepEqual(pd, {
    name: 'Content lead',
    framework: { name: 'Test framework', version: '0.1' },
    levels: [
      {
        code: 'WRIT',
        name: 'AI-assisted writing',
        description: 'Using AI to draft and edit writing.',
        level: 3,
        level_name: 'Practitioner',
        descriptor: 'Uses AI routinely for drafting and editing.',
        priority: 'essential',
      },
      {
        code: 'LEAD',
        name: 'Leading with AI',
        description: 'A fixture skill defined at every level.',
        level: 6,
        level_name: 'Authority',
        descriptor: 'Sets policy.',
        priority: 'essential',
      },
      {
        code: 'INST',
        name: 'Instructing AI',
        description: 'Communicating intent to AI systems.',
        level: 2,
        level_name: 'Assisted',
        descriptor: 'Writes clear requests with templates.',
        priority: 'desirable',
      },
    ],
  });
});

test('a target with no levels gives an empty position description', () => {
  assert.deepEqual(buildPositionDescription(fw, { name: 'Empty', levels: [] }).levels, []);
});
