const Router = require('express');
const controller = require('../controllers/controller.js');

const router = Router();

router.post('/validateUser', controller.validateUser);
router.post('/createUser', controller.createUser);
router.get('/getCountries', controller.getCountries);
router.post('/buy', controller.buy);
router.post('/sell', controller.sell);

module.exports = router;