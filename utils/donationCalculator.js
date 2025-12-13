/**
 * Donation Calculator Utility
 * 
 * This module contains calculation functions that can be tested with mutation testing
 */

/**
 * Calculate donation amount after platform fee
 * @param {number} amount - Original donation amount
 * @param {number} platformFeePercent - Platform fee percentage (default: 10%)
 * @returns {number} - Amount after platform fee deduction
 */
function calculateDonationAfterFee(amount, platformFeePercent = 10) {
  if (amount <= 0) {
    throw new Error('Donation amount must be greater than 0');
  }
  
  const feeAmount = (amount * platformFeePercent) / 100;
  return amount - feeAmount;
}

/**
 * Calculate popularity score for a campaign
 * @param {number} participantCount - Current number of participants
 * @param {number} targetParticipants - Target number of participants
 * @returns {number} - Popularity score (0-100)
 */
function calculatePopularityScore(participantCount, targetParticipants) {
  if (targetParticipants <= 0) {
    return 0;
  }
  
  const score = (participantCount / targetParticipants) * 100;
  return Math.round(Math.min(score, 100)); // Cap at 100
}

/**
 * Calculate total donations for a campaign
 * @param {Array} donations - Array of donation objects with amount property
 * @returns {number} - Total donation amount
 */
function calculateTotalDonations(donations) {
  if (!Array.isArray(donations)) {
    return 0;
  }
  
  return donations.reduce((total, donation) => {
    return total + (donation.amount || 0);
  }, 0);
}

/**
 * Calculate campaign completion percentage
 * @param {number} collectedAmount - Amount collected so far
 * @param {number} targetAmount - Target amount to collect
 * @returns {number} - Completion percentage (0-100)
 */
function calculateCompletionPercentage(collectedAmount, targetAmount) {
  if (targetAmount <= 0) {
    return 0;
  }
  
  const percentage = (collectedAmount / targetAmount) * 100;
  return Math.round(Math.min(percentage, 100)); // Cap at 100
}

module.exports = {
  calculateDonationAfterFee,
  calculatePopularityScore,
  calculateTotalDonations,
  calculateCompletionPercentage
};

