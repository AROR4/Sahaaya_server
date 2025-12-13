/**
 * DONATION CALCULATOR - MUTATED VERSION
 * 
 * ⚠️ WARNING: This file contains intentional mutations for testing purposes
 * This demonstrates what happens when code has bugs that tests should catch
 * 
 * ORIGINAL: return amount - feeAmount;
 * MUTATED:  return amount + feeAmount;  ❌ (should add fee instead of subtract)
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
  // MUTATION: Changed subtraction to addition
  return amount + feeAmount; // ❌ BUG: Should be amount - feeAmount
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
  
  // MUTATION: Changed division to multiplication
  const score = (participantCount * targetParticipants) * 100; // ❌ BUG: Should be participantCount / targetParticipants
  return Math.round(Math.min(score, 100));
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
  
  // MUTATION: Changed addition to subtraction
  return donations.reduce((total, donation) => {
    return total - (donation.amount || 0); // ❌ BUG: Should be total + (donation.amount || 0)
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
  
  // MUTATION: Changed division to multiplication
  const percentage = (collectedAmount * targetAmount) * 100; // ❌ BUG: Should be collectedAmount / targetAmount
  return Math.round(Math.min(percentage, 100));
}

module.exports = {
  calculateDonationAfterFee,
  calculatePopularityScore,
  calculateTotalDonations,
  calculateCompletionPercentage
};

