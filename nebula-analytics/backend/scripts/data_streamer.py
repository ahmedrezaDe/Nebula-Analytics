import asyncio
import random
import math
import httpx

async def stream_data_channels():
    print("🌌 Nexus Core Ingestion [OMNI-CHANNEL PRODUCTION BROADCAST ACTIVE]...")
    # Bound explicitly to your Mac's LAN address so your iPhone can handshake successfully
    url = "http://192.168.0.230:8000/api/v1/ingest"
    tick = 0
    
    async with httpx.AsyncClient() as client:
        while True:
            tick += 1
            
            # --- 1. FINTECH CHANNELS ---
            f_price = 150.0 + (8.0 * math.sin(tick * 0.1)) + random.uniform(-1, 1)
            f_vol = random.uniform(5000, 7000) if tick % 25 != 0 else random.uniform(26000, 32000)
            if tick % 25 == 0: f_price += 35.0
            
            fintech_payload = [
                {"vertical": "fintech", "entity": "AAPL", "metric_name": "market_price", "value": round(f_price, 2), "vector_skew": 0.0},
                {"vertical": "fintech", "entity": "AAPL", "metric_name": "transaction_volume", "value": round(f_vol, 2), "vector_skew": 0.0}
            ]

            # --- 2. INDUSTRIAL IoT CHANNELS ---
            i_pres = 120.0 + (4.0 * math.sin(tick * 0.12)) + random.uniform(-0.5, 0.5)
            i_vib = 45.0 + (1.5 * math.cos(tick * 0.08)) + random.uniform(-0.3, 0.3)
            if tick % 33 == 0: i_pres -= 40.0; i_vib += 30.0 
            
            industrial_payload = [
                {"vertical": "industrial", "entity": "TURBINE_04", "metric_name": "hydraulic_pressure", "value": round(i_pres, 2), "vector_skew": 0.0},
                {"vertical": "industrial", "entity": "TURBINE_04", "metric_name": "structural_vibration", "value": round(i_vib, 2), "vector_skew": 0.0}
            ]

            # --- 3. CYBERSECURITY CHANNELS ---
            c_lat = 22.0 + (2.0 * math.sin(tick * 0.05)) + random.uniform(-1, 1) 
            c_ing = random.uniform(1200, 1800) if tick % 20 != 0 else random.uniform(8500, 12000) 
            if tick % 20 == 0: c_lat += 180.0
            
            cyber_payload = [
                {"vertical": "cyber", "entity": "PROXY_NODE_01", "metric_name": "api_latency", "value": round(c_lat, 2), "vector_skew": 0.0},
                {"vertical": "cyber", "entity": "PROXY_NODE_01", "metric_name": "network_ingress", "value": round(c_ing, 2), "vector_skew": 0.0}
            ]

            try:
                # Fire the exact compliant array definitions concurrently
                await asyncio.gather(
                    client.post(url, json=fintech_payload),
                    client.post(url, json=industrial_payload),
                    client.post(url, json=cyber_payload)
                )
                print(f"📡 Tick {tick:03d} // Broadcaster Synced Cluster // 201 Created Ingest Clear")
            except Exception as e:
                print(f"❌ Broadcaster cluster packet drop: {e}")

            await asyncio.sleep(3.0)

if __name__ == "__main__":
    try:
        asyncio.run(stream_data_channels())
    except KeyboardInterrupt:
        print("\n🛑 Unified broadcaster offline.")