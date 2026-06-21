const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
    capaMfe: 'http://localhost:4201/remoteEntry.js',
    deviationMfe: 'http://localhost:4202/remoteEntry.js',
    changeControlMfe: 'http://localhost:4203/remoteEntry.js',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
