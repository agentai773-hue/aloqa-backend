const express = require('express');
const { 
  getVoices, 
  getVoiceById, 
  getVoiceProviders, 
  getAccentCategories,
  assignVoice,
  getAssignedVoices,
  unassignVoice
} = require('../controllers/voiceController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// Apply auth middleware to all voice routes
router.use(protect);

/**
 * @route   GET /admin/voices
 * @desc    Get all voices with optional filtering and sorting
 * @access  Private (Admin)
 * @query   {String} [provider] - Filter by voice provider
 * @query   {String} [search] - Search in voice name, accent, model
 * @query   {String} [accent] - Filter by voice accent
 * @query   {String} [sortBy=name] - Sort field (name, provider, accent, model)
 * @query   {String} [sortDirection=asc] - Sort direction (asc, desc)
 */
router.get('/', getVoices);

/**
 * @route   GET /admin/voices/providers
 * @desc    Get all unique voice providers
 * @access  Private (Admin)
 */
router.get('/providers', getVoiceProviders);

/**
 * @route   GET /admin/voices/accents
 * @desc    Get all unique voice accents
 * @access  Private (Admin)
 */
router.get('/accents', getAccentCategories);

/**
 * @route   POST /admin/voices/assign
 * @desc    Assign voice to user
 * @access  Private (Admin)
 * @body    {String} voiceId - Voice ID to assign
 * @body    {String} userId - User ID to assign voice to
 */
router.post('/assign', assignVoice);

/**
 * @route   GET /admin/voices/assignments
 * @desc    Get assigned voices
 * @access  Private (Admin)
 * @query   {String} [userId] - Filter by user ID
 */
router.get('/assignments', getAssignedVoices);

/**
 * @route   DELETE /admin/voices/assignments/:assignmentId
 * @desc    Unassign voice from user
 * @access  Private (Admin)
 * @param   {String} assignmentId - Assignment ID to remove
 */
router.delete('/assignments/:assignmentId', unassignVoice);

/**
 * @route   GET /admin/voices/:voiceId
 * @desc    Get voice details by ID
 * @access  Private (Admin)
 * @param   {String} voiceId - Voice ID or voice_id
 */
router.get('/:voiceId', getVoiceById);

module.exports = router;