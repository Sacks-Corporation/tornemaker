import auth from './auth'
import common from './common'
import dashboard from './dashboard'

const es = {
  auth,
  common,
  dashboard,
} as const

export default es
