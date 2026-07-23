import auth from './auth'
import common from './common'
import dashboard from './dashboard'
import tournaments from './tournaments'
import users from './users'

const es = {
  auth,
  common,
  dashboard,
  tournaments,
  users,
} as const

export default es
