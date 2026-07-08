import home from './home'
import common from './common'
import auth from './auth'
import tournament from './tournament'

const es = {
  home,
  common,
  auth,
  tournament,
} as const

export default es
