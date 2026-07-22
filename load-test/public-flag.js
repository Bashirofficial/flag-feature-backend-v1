import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const API_KEY = __ENV.API_KEY;
const failedRequests = new Counter("failed_requests");

export const options = {
  vus: 100,
  duration: "30s",
};

export default function () {
  const response = http.get("http://localhost:8000/api/v1/public/flags", {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (response.status !== 200) {
    console.log(`Status: ${response.status}`);
    console.log(response.body);
    failedRequests.add(1);
  }

  check(response, {
    "status is 200": (r) => r.status === 200,
  });
}
