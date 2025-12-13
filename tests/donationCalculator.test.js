const {
  calculateDonationAfterFee,
  calculatePopularityScore,
  calculateTotalDonations,
  calculateCompletionPercentage
} = require('../utils/donationCalculator');

describe('Donation Calculator', () => {
  describe('calculateDonationAfterFee', () => {
    it('should calculate donation after 10% platform fee', () => {
      const result = calculateDonationAfterFee(100, 10);
      expect(result).toBe(90);
    });

    it('should calculate donation after custom platform fee', () => {
      const result = calculateDonationAfterFee(100, 5);
      expect(result).toBe(95);
    });

    it('should throw error for zero amount', () => {
      expect(() => calculateDonationAfterFee(0)).toThrow('Donation amount must be greater than 0');
    });

    it('should throw error for negative amount', () => {
      expect(() => calculateDonationAfterFee(-10)).toThrow('Donation amount must be greater than 0');
    });

    it('should handle large amounts correctly', () => {
      const result = calculateDonationAfterFee(10000, 10);
      expect(result).toBe(9000);
    });
  });

  describe('calculatePopularityScore', () => {
    it('should calculate popularity score correctly', () => {
      const result = calculatePopularityScore(50, 100);
      expect(result).toBe(50);
    });

    it('should return 100 when participants exceed target', () => {
      const result = calculatePopularityScore(150, 100);
      expect(result).toBe(100);
    });

    it('should return 0 for zero target', () => {
      const result = calculatePopularityScore(50, 0);
      expect(result).toBe(0);
    });

    it('should return 0 for negative target', () => {
      const result = calculatePopularityScore(50, -10);
      expect(result).toBe(0);
    });

    it('should round the score correctly', () => {
      const result = calculatePopularityScore(33, 100);
      expect(result).toBe(33);
    });
  });

  describe('calculateTotalDonations', () => {
    it('should calculate total from donation array', () => {
      const donations = [
        { amount: 100 },
        { amount: 200 },
        { amount: 50 }
      ];
      const result = calculateTotalDonations(donations);
      expect(result).toBe(350);
    });

    it('should return 0 for empty array', () => {
      const result = calculateTotalDonations([]);
      expect(result).toBe(0);
    });

    it('should handle donations with missing amount', () => {
      const donations = [
        { amount: 100 },
        {},
        { amount: 50 }
      ];
      const result = calculateTotalDonations(donations);
      expect(result).toBe(150);
    });

    it('should return 0 for non-array input', () => {
      const result = calculateTotalDonations(null);
      expect(result).toBe(0);
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate completion percentage correctly', () => {
      const result = calculateCompletionPercentage(5000, 10000);
      expect(result).toBe(50);
    });

    it('should return 100 when collected exceeds target', () => {
      const result = calculateCompletionPercentage(15000, 10000);
      expect(result).toBe(100);
    });

    it('should return 0 for zero target', () => {
      const result = calculateCompletionPercentage(5000, 0);
      expect(result).toBe(0);
    });

    it('should return 0 for negative target', () => {
      const result = calculateCompletionPercentage(5000, -1000);
      expect(result).toBe(0);
    });

    it('should round the percentage correctly', () => {
      const result = calculateCompletionPercentage(3333, 10000);
      expect(result).toBe(33);
    });
  });
});

