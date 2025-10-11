const crypto = require("crypto");

// Minimal HS256 JWT (sign/verify) without external dependencies
const jwt = {
	sign(payload, secret, options = {}) {
		const header = { alg: "HS256", typ: "JWT" };
		const now = Math.floor(Date.now() / 1000);
		const exp = options.expiresIn ? now + parseExpiry(options.expiresIn) : undefined;
		const fullPayload = exp ? Object.assign({ iat: now, exp }, payload) : Object.assign({ iat: now }, payload);
		const encodedHeader = base64UrlEncode(JSON.stringify(header));
		const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
		const data = encodedHeader + "." + encodedPayload;
		const signature = signHmacSha256(data, secret);
		return data + "." + signature;
	},
	verify(token, secret) {
		const parts = String(token).split(".");
		if (parts.length !== 3) throw new Error("Invalid token format");
		const encodedHeader = parts[0];
		const encodedPayload = parts[1];
		const signature = parts[2];
		const data = encodedHeader + "." + encodedPayload;
		const expected = signHmacSha256(data, secret);
		if (!timingSafeEqual(signature, expected)) throw new Error("Invalid signature");
		const payload = JSON.parse(base64UrlDecode(encodedPayload));
		if (payload && payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error("Token expired");
		return payload;
	},
};

function base64UrlEncode(input) {
	return Buffer.from(input)
		.toString("base64")
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

function base64UrlDecode(input) {
	const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
	const pad = (4 - (normalized.length % 4 || 4)) % 4;
	return Buffer.from(normalized + "=".repeat(pad), "base64").toString("utf8");
}

function signHmacSha256(data, secret) {
	return crypto
		.createHmac("sha256", secret)
		.update(data)
		.digest("base64")
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

function timingSafeEqual(a, b) { // To prevent Timing attacks by hackers
	const aBuf = Buffer.from(String(a));
	const bBuf = Buffer.from(String(b));
	if (aBuf.length !== bBuf.length) return false;
	return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseExpiry(exp) {
	if (typeof exp === "number") return exp; // seconds
	const match = /^([0-9]+)([smhd])$/.exec(String(exp));
	if (!match) return 0;
	const n = parseInt(match[1], 10);
	const unit = match[2];
	switch (unit) {
		case "s": return n;
		case "m": return n * 60;
		case "h": return n * 3600;
		case "d": return n * 86400;
		default: return 0;
	}
}

const JWT_EXPIRY = "3600";
const JWT_COOKIE_NAME = "token";

function getJwtSecret() {
	return process.env.JWT_SECRET || "secret";
}

function hashPassword(plainText) {
	const salt = crypto.randomBytes(16);
	const derivedKey = crypto.scryptSync(String(plainText), salt, 64);
	return "scrypt$" + salt.toString("hex") + "$" + derivedKey.toString("hex");
}

function verifyPassword(plainText, stored) {
	try {
		const parts = String(stored).split("$");
		if (parts.length !== 3 || parts[0] !== "scrypt") return false;
		const salt = Buffer.from(parts[1], "hex");
		const expected = Buffer.from(parts[2], "hex");
		const derived = crypto.scryptSync(String(plainText), salt, expected.length);
		return crypto.timingSafeEqual(expected, derived);
	} catch (_) {
		return false;
	}
}

async function getUserModel() {
	// models/user.js is ESM with default export
	const mod = await import("../models/user.js");
	return mod.default;
}

function sanitizeUser(userDoc) {
	const obj = typeof userDoc.toObject === "function" ? userDoc.toObject() : userDoc;
	const id = obj && obj._id && typeof obj._id.toString === "function" ? obj._id.toString() : obj._id;
	return {
		id: id,
		firstName: obj.firstName,
		lastName: obj.lastName,
		username: obj.username,
		email: obj.email,
		phone: obj.phone,
		role: obj.role,
		profileImage: obj.profileImage,
	};
}

async function register(req, res) {
	try {
		const User = await getUserModel();
		const body = req.body || {};
		const firstName = body.firstName;
		const lastName = body.lastName;
		const email = body.email;
		const username = body.username;
		const phone = body.phone;
		const password = body.password;
		if (!firstName || !email || !password) {
			return res.status(400).json({ message: "firstName, email and password are required" });
		}
		const existing = await User.findOne({ $or: [{ email: email }, { username: username }, { phone: phone }] });
		if (existing) {
			return res.status(409).json({ message: "User already exists" });
		}
		const passwordHash = hashPassword(password);
		const created = await User.create({ firstName: firstName, lastName: lastName, email: email, username: username, phone: phone, password: passwordHash });
		const token = jwt.sign({ sub: String(created._id), role: created.role }, getJwtSecret(), { expiresIn: 3600 });
		setAuthCookie(res, token);
		return res.status(201).json({ user: sanitizeUser(created), token: token });
	} catch (err) {
		return res.status(500).json({ message: err && err.message ? err.message : "Registration failed" });
	}
}

async function login(req, res) {
	try {
		const User = await getUserModel();
		const body = req.body || {};
		const email = body.email;
		const username = body.username;
		const phone = body.phone;
		const password = body.password;
		if (!password || (!email && !username && !phone)) {
			return res.status(400).json({ message: "Provide email/username/phone and password" });
		}
		const query = email ? { email: email } : (username ? { username: username } : { phone: phone });
		const user = await User.findOne(query);
		if (!user || !verifyPassword(password, user.password)) {
			return res.status(401).json({ message: "Invalid credentials" });
		}
		const token = jwt.sign({ sub: String(user._id), role: user.role }, getJwtSecret(), { expiresIn: JWT_EXPIRY });
		setAuthCookie(res, token);
		return res.status(200).json({ user: sanitizeUser(user), token: token });
	} catch (err) {
		return res.status(500).json({ message: err && err.message ? err.message : "Login failed" });
	}
}

async function me(req, res) { // To check when user came back is authenticated or not?
	try {
		const token = getTokenFromRequest(req);
		if (!token) return res.status(401).json({ message: "Not authenticated" });
		const payload = jwt.verify(token, getJwtSecret());
		const User = await getUserModel();
		const user = await User.findById(payload.sub);
		if (!user) return res.status(404).json({ message: "User not found" });
		return res.status(200).json({ user: sanitizeUser(user) });
	} catch (err) {
		return res.status(401).json({ message: err && err.message ? err.message : "Invalid token" });
	}
}

async function logout(req, res) {
	clearAuthCookie(res);
	return res.status(200).json({ message: "Logged out" });
}

function setAuthCookie(res, token) {
	const isProd = process.env.NODE_ENV === "production";
	res.cookie(JWT_COOKIE_NAME, token, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
		path: "/",
	});
}

function clearAuthCookie(res) {
	res.clearCookie(JWT_COOKIE_NAME, { path: "/" });
}

function getTokenFromRequest(req) {
	if (req.cookies && req.cookies[JWT_COOKIE_NAME]) return req.cookies[JWT_COOKIE_NAME];
	const auth = req.headers && (req.headers["authorization"] || req.headers["Authorization"]);
	if (auth && typeof auth === "string" && auth.indexOf("Bearer ") === 0) return auth.slice(7);
	return null;
}

module.exports = { register, login, me, logout };


