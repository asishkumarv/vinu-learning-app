const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

router.get('/classes', contentController.getClasses);
router.get('/subjects/:classId', contentController.getSubjectsByClass);
router.get('/chapters/:subjectId', contentController.getChaptersBySubject);
router.get('/episodes/:chapterId', contentController.getEpisodesByChapter);
router.get('/releases/recent', contentController.getRecentReleases);
router.get('/video/:episodeId', contentController.streamVideo);

module.exports = router;
