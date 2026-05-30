import http from 'k6/http'
import { check, sleep } from 'k6'

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // ramp up to 10 users
    { duration: '20s', target: 50 },  // ramp up to 50 users
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
},
}

const BASE_URL = 'https://next-auction-iota.vercel.app'
const CAR_ID = 'cmprd50im000004jnjijwm57e'  // your active car

export default function k6BidTest() {
  // Test 1: Car listing page
  const listing = http.get(`${BASE_URL}/en/cars`)
  check(listing, {
    'listing page status 200': (r) => r.status === 200,
    'listing page fast': (r) => r.timings.duration < 2000,
  })

  sleep(1)

  // Test 2: Car detail page
  const detail = http.get(`${BASE_URL}/en/cars/${CAR_ID}`)
  check(detail, {
    'detail page status 200': (r) => r.status === 200,
    'detail page fast': (r) => r.timings.duration < 2000,
  })

  sleep(1)
}