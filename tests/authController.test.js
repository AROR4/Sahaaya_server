const authController = require("../controllers/authcontroller1");
const User1 = require("../models/user1");
const jwt = require("jsonwebtoken");


jest.mock("../models/user1");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("Signup", () => {
    it("should return 400 if fields missing", async () => {
      req.body = { email: "a@test.com" }; // missing name + password
      await authController.signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if user exists", async () => {
      req.body = { name: "Test", email: "a@test.com", password: "123456" };
      User1.findOne.mockResolvedValue({ email: "a@test.com" });

      await authController.signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create user and return token", async () => {
      req.body = { name: "Test", email: "a@test.com", password: "123456" };
      User1.findOne.mockResolvedValue(null);
      User1.create.mockResolvedValue({ _id: "1", name: "Test", email: "a@test.com" });
      jwt.sign.mockReturnValue("fake-jwt");

      await authController.signup(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          token: "fake-jwt",
        })
      );
    });
  });

  describe("Login", () => {
    it("should return 404 if user not found", async () => {
      req.body = { email: "a@test.com", password: "123456" };
      User1.findOne.mockResolvedValue(null);

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 401 if password mismatch", async () => {
      req.body = { email: "a@test.com", password: "wrongpass" };
      User1.findOne.mockResolvedValue({ matchPassword: jest.fn().mockResolvedValue(false) });

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 200 and token if login success", async () => {
      req.body = { email: "a@test.com", password: "123456" };
      User1.findOne.mockResolvedValue({
        _id: "1",
        name: "Test",
        email: "a@test.com",
        matchPassword: jest.fn().mockResolvedValue(true),
      });
      jwt.sign.mockReturnValue("fake-jwt");

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          token: "fake-jwt",
        })
      );
    });
  });
});
