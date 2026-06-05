import asyncio
import random
import math
import httpx
import sys
import os

async def stream_to_api_endpoint():
    print("🌌 Nebula Real-Time Data Streamer [API Mode] Active...")
    url = "http://127.0.0.1:8000/api/v1/ingest"
    tick = 0
    
    # Use httpx client connection pools for optimized performance
    async with httpx.AsyncClient() as client:
        while True:
            tick += 1
            base_value = 150.0 + (10.0 * math.sin(tick * 0.1))
            noise = random.uniform(-1.5, 1.5)
            final_value = base_value + noise
            is_anomaly = False
            
            # Trigger heavy anomalies every 25 ticks
            if tick % 25 == 0:
                is_anomaly = True
                anomaly_direction = random.choice([0.4, 2.5])
                if anomaly_direction < 1.0:
                    final_value = base_value - (base_value * 0.25)
                else:
                    final_value = base_value + (base_value * 0.40)
            
            # Format feature package payload dictionary blocks
            payload = [
                {
                    "entity": "AAPL",
                    "metric_name": "market_price",
                    "value": round(final_value, 2)
                },
                {
                    "entity": "AAPL",
                    "metric_name": "transaction_volume",
                    "value": round(random.uniform(5000, 7000) if not is_anomaly else random.uniform(25000, 35000), 2)
                }
            ]
            
            try:
                response = client.post(url, json=payload)
                await response  # Complete asynchronous execution boundary
                
                if is_anomaly:
                    print(f"⚠️ Tick {tick:03d} | Anomaly Injected! Sent to API Ingest. Status code: {response.is_resolved}")
                else:
                    print(f"📈 Tick {tick:03d} | Sent data package to API | Price: {payload[0]['value']} | Vol: {payload[1]['value']}")
                    
            except Exception as e:
                print(f"❌ Connection error on step transmission loop: {e}")
                
            await asyncio.sleep(1.0)

if __name__ == "__main__":
    try:
        asyncio.run(stream_to_api_endpoint())
    except KeyboardInterrupt:
        print("\n🛑 Streamer exited cleanly.")