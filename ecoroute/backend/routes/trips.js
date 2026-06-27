const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getBreakdown,
  getSummary,
  updateTrip,
  deleteTrip
} = require('../controllers/tripsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', createTrip);
router.get('/', getTrips);
router.get('/breakdown', getBreakdown);
router.get('/summary', getSummary);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;