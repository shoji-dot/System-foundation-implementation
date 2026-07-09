import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";

/**
 * Phase 6「負荷/セキュリティテスト」向けk6負荷テストスクリプト。
 * 小規模B2B想定(同時20ユーザー程度)でauth+主要read APIのレイテンシ・エラー率を検証する。
 *
 * 実行方法は loadtest/README.md を参照。
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001/api/v1";
// 既存のテスト専用アカウントを使い回したい場合に指定する(未指定ならsetup()で使い捨てアカウントを作成)。
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;

const loginFailureRate = new Rate("login_failed");
const readFailureRate = new Rate("read_failed");

export const options = {
  scenarios: {
    // 主要read APIの利用シナリオ(ログイン後の通常利用を模擬)。0->20VUへランプアップし2分維持する。
    read_flow: {
      executor: "ramping-vus",
      exec: "readFlow",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "90s", target: 20 },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    // ログインAPI単体のレイテンシ監視。auth/loginのレート制限(10回/分)を超えないよう低頻度で実行する。
    auth_flow: {
      executor: "constant-arrival-rate",
      exec: "authFlow",
      rate: 4,
      timeUnit: "1m",
      duration: "2m15s",
      preAllocatedVUs: 2,
      maxVUs: 5,
    },
  },
  thresholds: {
    "http_req_duration{scenario:read_flow}": ["p(95)<500"],
    "http_req_duration{scenario:auth_flow}": ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
    login_failed: ["rate<0.01"],
    read_failed: ["rate<0.01"],
  },
};

function jsonHeaders() {
  return { headers: { "Content-Type": "application/json" } };
}

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * テスト用アカウントを1件だけ用意し(TEST_USER_EMAIL指定時はsignupをスキップ)、
 * ログインしてアクセストークンを取得する。全VU・全イテレーションで使い回すことで、
 * signup(5回/分)・login(10回/分)のレート制限を消費し尽くさないようにする。
 */
export function setup() {
  const email =
    TEST_USER_EMAIL ||
    `k6-loadtest-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = TEST_USER_PASSWORD || "LoadTest123!";

  if (!TEST_USER_EMAIL) {
    const signupRes = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({ email, password, name: "k6 Load Test" }),
      jsonHeaders(),
    );
    check(signupRes, { "setup: signup succeeded (201)": (r) => r.status === 201 });
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    jsonHeaders(),
  );
  check(loginRes, { "setup: login succeeded (200)": (r) => r.status === 200 });

  const body = loginRes.json();
  if (!body || !body.accessToken) {
    throw new Error(
      `setup: ログインに失敗しアクセストークンを取得できませんでした(status=${loginRes.status})。BASE_URL/TEST_USER_EMAIL/TEST_USER_PASSWORDを確認してください。`,
    );
  }

  return { email, password, accessToken: body.accessToken };
}

/** ログイン後の通常利用を模擬し、主要read APIを一巡する。 */
export function readFlow(data) {
  const headers = authHeaders(data.accessToken);

  group("me", () => {
    const res = http.get(`${BASE_URL}/me`, headers);
    readFailureRate.add(res.status !== 200);
    check(res, { "GET /me 200": (r) => r.status === 200 });
  });

  group("projects", () => {
    const res = http.get(`${BASE_URL}/projects?limit=20`, headers);
    readFailureRate.add(res.status !== 200);
    check(res, { "GET /projects 200": (r) => r.status === 200 });
  });

  group("regulations", () => {
    const res = http.get(`${BASE_URL}/regulations?limit=20`, headers);
    readFailureRate.add(res.status !== 200);
    check(res, { "GET /regulations 200": (r) => r.status === 200 });
  });

  group("search", () => {
    const res = http.get(
      `${BASE_URL}/search?q=${encodeURIComponent("医薬品")}&scope=all&limit=20`,
      headers,
    );
    readFailureRate.add(res.status !== 200);
    check(res, { "GET /search 200": (r) => r.status === 200 });
  });

  group("notifications", () => {
    const res = http.get(`${BASE_URL}/notifications?limit=20`, headers);
    readFailureRate.add(res.status !== 200);
    check(res, { "GET /notifications 200": (r) => r.status === 200 });
  });

  group("courses", () => {
    const res = http.get(`${BASE_URL}/courses?limit=20`, headers);
    readFailureRate.add(res.status !== 200);
    check(res, { "GET /courses 200": (r) => r.status === 200 });
  });

  sleep(1);
}

/** setup()で作成した同一アカウントでログインを繰り返し、login API単体のレイテンシを計測する。 */
export function authFlow(data) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: data.email, password: data.password }),
    jsonHeaders(),
  );

  loginFailureRate.add(res.status !== 200);
  check(res, { "POST /auth/login 200": (r) => r.status === 200 });
}
