import express from 'express';
import * as controllers from '../../controllers/index';
import { verifyJWT } from '../../middlewares/auth.middleware';

const router = express.Router();

router.use(verifyJWT);

router.route('/book-seat/:eventId').post(controllers.reserveSeat);

router.route('/search-available-seats/:seatId').get(controllers.searchForAvailableSeats);

router.route('/user-seats/:seatId').get(controllers.fetchSeatsAssociatedWithUser);

export { router };
