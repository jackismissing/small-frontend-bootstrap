/**
 * Gulp configuration file
 * @type {Object}
 */
module.exports = {
	env: 'dev',
	baseUrl: 'project.dev',
	srcPath: 'resources',
	srcAssetsPath: 'resources/assets',
	publicPath: 'public',
	buildPath: 'public/build',
    autoprefixer: { 'browsers': ["last 4 version", "Firefox >= 20", "Firefox ESR", "Opera 12.1", "> 1%", "ie 9", "last 3 Android version"] }
}
