import auth from './auth'
import common from './common'
import dashboard from './dashboard'
import users from './users'

const es = {
  auth,
  common,
  dashboard,
  users,
} as const

export default es
