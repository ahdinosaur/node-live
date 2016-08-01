const cat = require('pull-cat')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const map = require('pull-stream/throughs/map')
const filter = require('pull-stream/throughs/filter')
const drain = require('pull-stream/sinks/drain')
const Watch = require('pull-watch')

module.exports = nodeLive

function nodeLive (entry, options) {
  entry = require.resolve(entry)

  const watch = Watch(entry, options)
  var required = {}

  const requireJs = require.extensions['.js']
  require.extensions['.js'] = function (module, filename) {
    watch.add(filename)
    return requireJs(module, filename)
  }

  pull(
    cat([
      values([entry]),
      pull(
        watch.listen(),
        map(function ({ type, path }) {
          return type === 'change' && path
        }),
        filter()
      )
    ]),
    drain(path => {
      decache(path)
      tryRequire(entry)
    })
  )
}

function decache (id) {
  while (id) {
    const module = require.cache[id]
    if (!module) return
    delete require.cache[id]
    id = module.parent && module.parent.id
  }
}

function tryRequire (path) {
  try {
    require(path)
  } catch (err) {
    console.error(err)
  }
}
