const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
    capaMfe: 'capaMfe@/capa-mfe/remoteEntry.js',
    deviationMfe: 'deviationMfe@/deviation-mfe/remoteEntry.js',
    changeControlMfe: 'changeControlMfe@/change-control-mfe/remoteEntry.js',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
