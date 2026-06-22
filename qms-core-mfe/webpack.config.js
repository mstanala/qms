const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'qmsCoreMfe',

  exposes: {
    './RiskModule': './src/app/risk/risk.routes.ts',
    './AuditModule': './src/app/audit/audit.routes.ts',
    './SupplierModule': './src/app/supplier/supplier.routes.ts',
    './ComplaintModule': './src/app/complaint/complaint.routes.ts',
    './NonconformanceModule': './src/app/nonconformance/nonconformance.routes.ts',
    './EquipmentModule': './src/app/equipment/equipment.routes.ts',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
