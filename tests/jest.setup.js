// Prevent MongoDB from connecting during tests
jest.mock("../db", () => ({}));
