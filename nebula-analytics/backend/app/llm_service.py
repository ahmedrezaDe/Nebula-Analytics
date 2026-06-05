import os
from groq import Groq
from app.config import settings

class InsightGenerator:
    def __init__(self, provider: str = "groq"):
        self.provider = provider
        
        # Pull the key dynamically verified by our config layer
        if self.provider == "groq":
            if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_actual_groq_api_key_here":
                print("⚠️ [AI ENGINE] Warning: GROQ_API_KEY is unset or default placeholder state.")
            self.client = Groq(api_key=settings.GROQ_API_KEY)

    def generate_executive_summary(self, context: dict) -> str:
        """
        Takes raw structural anomaly data vectors and uses low-latency LLM profiles
        to compile deterministic business-facing diagnostics.
        """
        # Construct a strict, data-dense prompt. Enforce zero conversational filler.
        prompt = f"""
        You are a principal quantitative systems analyst. Review the following system anomaly data array:
        
        ENTITY TARGET: {context.get('entity')}
        TRACKED METRIC COMPONENT: {context.get('metric_name')}
        COMPUTED DEVIATION STRENGTH: {context.get('anomaly_score')} Anomaly Vector Points
        TELEMETRY DETAILS: {context.get('raw_description')}
        SYSTEM TIMESTAMP: {context.get('timestamp')}
        
        Provide a hyper-concise, exactly 2-sentence analytical insight summary for an executive dashboard.
        Sentence 1 must define the immediate structural trigger and data movement direction.
        Sentence 2 must isolate the highly probable market or infrastructure cause and impact.
        Do not include introductory text, conversational pleasantries, or markdown headers. Speak with absolute professional authority.
        """
        
        try:
            if self.provider == "groq":
                # Utilizing Llama 3.3 70B for institutional reasoning stability at blazing speeds
                completion = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",  # Updated to production-stable endpoint pathing
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.15,  # Low temperature to restrict hallucinations and force data adherence
                    max_tokens=120
                )
                return completion.choices[0].message.content.strip()
                
            # Future-proofing hook to switch provider engine targets effortlessly
            elif self.provider == "self_hosted":
                return "Local fine-tuned model interpretation fallback lane active."
                
        except Exception as e:
            return f"Diagnostic synthesis timeout error during core model evaluation sequence: {str(e)}"
        
        return "System telemetry evaluation skipped."