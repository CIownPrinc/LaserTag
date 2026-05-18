export const BackendEvents = {
  PLAYER_SESSION_JOIN: 'player.session.join',
  PLAYER_SESSION_JOINED: 'player.session.joined',
  PLAYER_JOINED: 'player.joined',
  PLAYER_LEFT: 'player.left',
  PLAYER_MOVE_UPDATE: 'player.move.update',
  PLAYER_MOVE_SNAPSHOT: 'player.move.snapshot',
  PLAYER_SHOOT: 'player.shoot',
  PLAYER_SHOT_BROADCAST: 'player.shot.broadcast',
  PLAYER_HIT_REPORT: 'player.hit.report',
  PLAYER_HIT_RESOLVED: 'player.hit.resolved',
  POWERUP_COLLECT_REQUEST: 'powerup.collect.request',
  POWERUP_COLLECTED: 'powerup.collected',
  POWERUP_SPAWNED: 'powerup.spawned',
} as const;

export const ApiRoutes = {
  PROFILE_UPDATE: '/api/profile',
  MATCH_END: '/api/match/end',
  SETTINGS_UPDATE: '/api/settings',
} as const;
