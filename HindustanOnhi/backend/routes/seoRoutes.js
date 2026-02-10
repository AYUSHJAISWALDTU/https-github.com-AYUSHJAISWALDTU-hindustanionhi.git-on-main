const express = require('express');
const router = express.Router();
const { getSitemap, getRobots } = require('../controllers/seoController');

router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', getRobots);

module.exports = router;
