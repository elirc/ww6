import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { assertValidRunTransition } = await loadTypeScript('src/services/allocationRunService.ts', { root, stubs: {
  '@/repositories/allocationRunRepository': {createAllocationRun:()=>{},getAllocationRunById:()=>{},listAllocationRuns:()=>{},replaceAllocationResults:()=>{},updateAllocationRunStatus:()=>{}},
  '@/services/allocationEngineService': {computeAllocationResults:()=>{}},
  '@/lib/queue/allocationQueue': {registerAllocationWorker:()=>{},enqueueAllocationRun:()=>{}},
}});
test('pending runs may start or fail', () => { assert.doesNotThrow(() => assertValidRunTransition({ from: 'PENDING', to: 'RUNNING' })); assert.doesNotThrow(() => assertValidRunTransition({ from: 'PENDING', to: 'FAILED' })); });
test('running runs may complete or fail', () => { assert.doesNotThrow(() => assertValidRunTransition({ from: 'RUNNING', to: 'COMPLETED' })); assert.doesNotThrow(() => assertValidRunTransition({ from: 'RUNNING', to: 'FAILED' })); });
test('terminal and skipped transitions are rejected', () => { for (const from of ['COMPLETED', 'FAILED']) assert.throws(() => assertValidRunTransition({ from, to: 'RUNNING' }), e => e.statusCode === 422 && e.code === 'VALIDATION_ERROR'); assert.throws(() => assertValidRunTransition({ from: 'PENDING', to: 'COMPLETED' }), e => e.statusCode === 422 && e.code === 'VALIDATION_ERROR'); });
test('invalid error names the attempted transition', () => { assert.throws(() => assertValidRunTransition({ from: 'FAILED', to: 'RUNNING' }), e => /FAILED.*RUNNING/.test(e.message)); });
