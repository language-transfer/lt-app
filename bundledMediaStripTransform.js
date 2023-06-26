const upstreamTransformer = require('metro-react-native-babel-transformer');

module.exports.transform = (params) => {
  // there are lots of cleaner ways to do this, but yagni
  if (
    params.options.platform !== 'ios' &&
    params.filename.includes('course-data.ts')
  ) {
    params.src = params.src.replace(
      /require\('\.\.\/resources\/courses\/.*.mp3'\)/g,
      'null',
    );
  }

  return upstreamTransformer.transform(params);
};
