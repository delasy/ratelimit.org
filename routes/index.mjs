import bodyParser from 'body-parser'
import { Router } from 'express'
import homeController from '../controllers/home.mjs'
import notFoundController from '../controllers/not-found.mjs'
import registerController from '../controllers/register.mjs'
import requestController from '../controllers/request.mjs'
import wrap from '../middlewares/wrap.mjs'

const router = Router()
const textParser = bodyParser.text({ type: () => true })

router.get('/', homeController)

if (process.env.APP_REGISTRATION !== 'false') {
  router.get('/register', wrap(registerController))
}

router.all('*', textParser, wrap(requestController), notFoundController)

export default router
