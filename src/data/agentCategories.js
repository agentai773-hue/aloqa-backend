/**
 * Agent Categories - Removed static data
 * All assistant configurations are now created directly from the frontend
 * This file is kept for legacy compatibility but returns empty data
 */

/**
 * @deprecated - Agent categories are no longer provided by backend
 * All configurations should come from the frontend
 */
const getAllCategories = () => {
  return [];
};

/**
 * @deprecated - Not used anymore
 */
const getCategoryConfig = () => {
  return null;
};

/**
 * @deprecated - Not used anymore
 */
const getDefaultConfig = () => {
  return null;
};

module.exports = {
  getAllCategories,
  getCategoryConfig,
  getDefaultConfig
};
