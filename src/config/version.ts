export const VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 'dev',
  toString: function() {
    return `v${this.major}.${this.minor}.${this.patch}-${this.build}`;
  }
}; 