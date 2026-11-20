module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  if (process.env.FOLIO_ANDROID_ARM64_ONLY === '1') {
    plugins.push([
      'expo-build-properties',
      {
        android: {
          buildArchs: ['arm64-v8a'],
        },
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
