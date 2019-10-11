'use strict'

const renderToStream = async (ctx, config) => {
  const baseDir = config.baseDir || process.cwd()
  const isLocal = config.env === 'local'
  const serverJs = config.serverJs
  const runtime = config.runtime
  if (config.type !== 'ssr') {
    const string = require('yk-cli/bin/renderLayout')
    return string
  }
  if (!global.renderToNodeStream) {
    if (runtime === 'fc') {
      // 针对fc runtime 将第三方模块打包进来不需要特殊处理
      global.renderToNodeStream = require('react-dom/server').renderToNodeStream
    } else {
      // for this issue https://github.com/ykfe/egg-react-ssr/issues/4
      global.renderToNodeStream = require(baseDir + '/node_modules/react-dom/server').renderToNodeStream
    }
  }

  if (isLocal) {
    // 本地开发环境下每次刷新的时候清空require服务端文件的缓存，保证服务端与客户端渲染结果一致
    delete require.cache[serverJs]
  }
  try {
    if (!global.serverStream || isLocal) {
      if (runtime === 'fc') {
        global.serverStream = typeof serverJs === 'string' ? require('../../../web/' + serverJs).default : serverJs
      } else {
        global.serverStream = typeof serverJs === 'string' ? require(serverJs).default : serverJs
      }
    }
  } catch (error) {
    // 兼容非fc场景编译的时候打包静态分析会报错，这里要catch一下，实际运行时无错误
  }

  const serverRes = await global.serverStream(ctx)
  const stream = global.renderToNodeStream(serverRes)
  return stream
}

export default renderToStream
