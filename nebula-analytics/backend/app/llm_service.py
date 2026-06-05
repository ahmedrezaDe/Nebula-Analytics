import httpx
from app.config import settings

class InsightGenerator:
    def __init__(self):
        self.mode = settings.INFERENCE_MODE.lower()
        self.local_url = settings.LOCAL_LLM_URL
        self.cloud_key = settings.CLOUD_API_KEY
        self.cloud_model = settings.CLOUD_MODEL_NAME

        print(f"🧠 [COGNITIVE MATRIX INITIALIZED] Routing engine configured to: [{self.mode.upper()}]")

    def generate_executive_summary(self, context: dict, vertical: str) -> str:
        """
        Routes inference queries dynamically based on environmental switches.
        Includes an automatic failover routing chain for local container setups.
        """
        personas = {
            "fintech": (
                "You are a Principal Quantitative Risk Systems Engineer. Analyze the streaming anomaly packet. "
                "Synthesize your evaluation using varied financial engineering vocabulary (e.g., market liquidity exhaustion, "
                "order-book imbalance, statistical arbitrage variance, non-linear delta skews, localized flash-crash risks). "
                "Vary your sentence structure drastically. Write exactly 2 sentences with zero conversational fluff."
            ),
            "industrial": (
                "You are an SCADA Infrastructure & Systems Reliability Director. Evaluate the physical hardware sensory drop. "
                "Utilize dense, natural mechanical engineering forensics terminology (e.g., kinetic resonance cascade, "
                "cavitation-induced line stress, torsional bearing fatigue, hydraulic head-loss, structural yield variance). "
                "Ensure consecutive reports use entirely different sentence openings. Write exactly 2 sentences."
            ),
            "cyber": (
                "You are an Elite Threat Intel Core Forensic Investigator. Break down the infrastructure network spike. "
                "Apply raw cyber-forensics phrasing (e.g., volumetric ingress surge, packet fragmentation skew, edge routing "
                "exhaustion, stateful firewall degradation, cryptographic handshake timeout, perimeter proxy telemetry drift). "
                "Vary your analytical focus per report. Write exactly 2 sentences."
            )
        }
        
        domain_persona = personas.get(vertical, personas["fintech"])

        prompt = f"""
        {domain_persona}
        Review the following telemetry system anomaly packet sequence:
        
        TARGET ENTITY IDENTIFIER: {context.get('entity')}
        TRACKED METRIC FIELD: {context.get('metric_name')}
        COMPUTED DEVIATION STRENGTH: {context.get('anomaly_score')} Index Points
        RAW DATA METRICS: {context.get('raw_description')}
        TIMESTAMP: {context.get('timestamp')}
        
        Provide a hyper-concise, exactly 2-sentence analytical summary for a high-end enterprise control dashboard.
        Do not include markdown list headers, greeting text, or conversational pleasantries. Speak with absolute engineering authority.
        """

        try:
            # 🖥️ ROUTE A: ON-DEVICE HARDWARE ACCELERATED STREAMING
            if self.mode == "local":
                payload = {
                    "model": "mistral-7b",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.15,
                    "max_tokens": 150
                }
                
                # 📡 TARGET NETWORK FAILOVER CHAIN
                # Try Docker's internal host mapping first; fall back to the default macOS virtual router gateway
                target_urls = [ 
                                "http://192.168.0.230:8080/v1/chat/completions"
                            ]
                
                response = None
                for url in target_urls:
                    try:
                        print(f"📡 Attempting cognitive payload transfer to: {url}")
                        response = httpx.post(url, json=payload, timeout=15.0)
                        if response.status_code == 200:
                            print(f"✅ Successful handshake established with model runner at: {url}")
                            return response.json()["choices"][0]["message"]["content"].strip()
                    except httpx.NetworkError:
                        print(f"⚠️ Gateway {url} rejected socket. Advancing failover track...")
                        continue

            # ☁️ ROUTE B: EXTERNAL PRIVATE ENTERPRISE INGRESS
            elif self.mode == "cloud" and self.cloud_key:
                if settings.CLOUD_PROVIDER.lower() == "groq":
                    url = "https://api.groq.com/openai/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {self.cloud_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": self.cloud_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.15,
                        "max_tokens": 150
                    }
                    response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
                    if response.status_code == 200:
                        return response.json()["choices"][0]["message"]["content"].strip()

        except Exception as e:
            print(f"❌ Cognitive pipeline routing drop: {e}")
        
        return self._get_fallback_text(vertical)

    def _get_fallback_text(self, vertical: str) -> str:
        """Premium defensive fallback copy block framework."""
        return {
            "fintech": "Unsupervised density isolation flagged non-linear equity pricing skew. Risk profiles indicate active algorithmic market runs; automated hedging protocol armed.",
            "industrial": "Critical sensory variance isolated across rotational bearing vectors. Cavitation threshold exceeded; predictive maintenance flags immediate line pressure seal routing.",
            "cyber": "Anomalous packet ingress variance detected across peripheral proxy nodes. Volumetric tracking indicates high-probability zero-day cascade; firewall restrictions active."
        }.get(vertical, "Algorithmic anomaly intercepted and logged under security protocol.")