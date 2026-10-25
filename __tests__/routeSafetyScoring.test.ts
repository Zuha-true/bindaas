import assert from 'node:assert/strict';
import test from 'node:test';
import { demoRoutes } from '../data/demoRoute.ts';
import { analyseRoute } from '../services/route/score.ts';
import { applySafetyScores, scoreRouteCandidates } from '../services/routeSafetyScoring.ts';

test('relative scoring ranks the candidates and exposes factors', () => {
  const analyses = demoRoutes.map(route => analyseRoute(route, Date.UTC(2026, 0, 5, 15), 'walk'));
  const ranked = applySafetyScores(analyses);
  assert.equal(ranked.length, 2);
  assert.equal(scoreRouteCandidates(analyses)[0].factors.length, 5);
  assert.equal(ranked.every(route => typeof route.relativeConcern === 'number'), true);
});

test('missing venues are unknown and do not become favourable evidence', () => {
  const route = analyseRoute({ ...demoRoutes[0], places: [] }, Date.UTC(2026, 0, 5, 15), 'walk');
  const score = scoreRouteCandidates([route])[0];
  assert.equal(score.unknowns.includes('Listed venues with known hours'), true);
  assert.equal(score.unknowns.includes('Listed help resources'), true);
});

test('equal candidates tie on normalized inputs', () => {
  const analyses = demoRoutes.slice(0, 1).map(route => analyseRoute(route, Date.UTC(2026, 0, 5, 15), 'walk'));
  const copy = { ...analyses[0], id: 'copy' };
  const scores = scoreRouteCandidates([analyses[0], copy]);
  assert.equal(scores[0].concern, scores[1].concern);
});
