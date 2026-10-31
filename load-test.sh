#!/bin/bash
# CloudPulse Automated Load Test Runner

ENDPOINT="${1:-http://localhost:3000}"
DURATION="${2:-210}"
CONCURRENCY="${3:-25}"
ITERATIONS="${4:-1500000}"

echo "=========================================================="
echo "           CloudPulse Controlled Load Generator           "
echo "=========================================================="
echo "Target Endpoint: $ENDPOINT"
echo "Test Duration:   ${DURATION} seconds"
echo "Concurrency:     $CONCURRENCY"
echo "CPU Iterations:  $ITERATIONS"
echo "=========================================================="
echo ""

# Verify connection
echo "Checking target health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT/api/health" || echo "FAILED")
if [ "$STATUS" != "200" ]; then
  echo "❌ Error: Cannot connect to $ENDPOINT/api/health (HTTP $STATUS)"
  exit 1
fi
echo "✅ Target is online and healthy. Starting stress generation..."
echo ""

if command -v hey &> /dev/null; then
  echo "Invoking 'hey' load engine..."
  hey -z "${DURATION}s" -c "$CONCURRENCY" -q 10 "$ENDPOINT/api/load-test?iterations=$ITERATIONS"
elif command -v ab &> /dev/null; then
  TOTAL_REQS=$((CONCURRENCY * DURATION * 3))
  echo "Invoking Apache Bench (ab)..."
  ab -n "$TOTAL_REQS" -c "$CONCURRENCY" "$ENDPOINT/api/load-test?iterations=$ITERATIONS"
else
  echo "Running parallel curl workers..."
  END_TIME=$((SECONDS + DURATION))
  COUNT=0
  while [ $SECONDS -lt $END_TIME ]; do
    for i in $(seq 1 "$CONCURRENCY"); do
      curl -s "$ENDPOINT/api/load-test?iterations=$ITERATIONS" > /dev/null &
    done
    wait
    COUNT=$((COUNT + CONCURRENCY))
    echo "  Processed $COUNT requests... ($(date +%H:%M:%S))"
  done
  echo "✅ Finished $COUNT requests."
fi

echo ""
echo "=========================================================="
echo "Load test sequence complete. Check your HPA and dashboard."
echo "=========================================================="

