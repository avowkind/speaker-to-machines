"""Build data/skills.json (draft v0.1) for the AI skills framework.

Tree shape: category -> subcategory -> skill -> record. Fields per skill:
  level_range  [min, max] levels at which the skill is defined
  levels       {level: descriptor}, from descriptors.py
  examples     current tools/models, dated; the volatile layer
  map          cross-references: SFIA codes (reference only) and appliedAI ids
"""
import json
from pathlib import Path

from descriptors import DESCRIPTORS

AS_OF = "2026-09"


def skill(code, desc, rng, examples=(), sfia=(), aai=()):
    return {
        "code": code,
        "description": desc,
        "level_range": list(rng),
        "levels": DESCRIPTORS.get(code, {}),
        "examples": {"as_of": AS_OF, "items": list(examples)},
        "map": {"sfia": list(sfia), "appliedai": list(aai)},
        "url": f"#/skill/{code}",
    }






TREE = {
    "Understanding AI": {
        "Concepts": {
            "AI literacy": skill("AILT", "Understanding at a conceptual level how AI systems, including generative and agentic AI, work; what they can and cannot do; and how they fail.", (1, 4),
                ["UNESCO AI competency framework", "EU–OECD AILit", "AI Fluency courses"], ["AIDE"], ["sc_0064"]),
            "Machine learning foundations": skill("MLFN", "Understanding how models learn from data: training, validation, generalisation, overfitting, metrics and the main families of learning.", (1, 5),
                ["scikit-learn", "fast.ai", "Kaggle"], ["MLNG"], ["sc_0119", "sc_0121"]),
            "Foundation model concepts": skill("FMIN", "Understanding how large foundation models work and behave: architecture, tokens and context windows, sampling, embeddings, reasoning modes, multimodality, and the effects of scale and training data.", (1, 6),
                ["transformer architecture", "reasoning models", "open-weight vs closed models"], ["MLNG"], []),
            "AI landscape awareness": skill("AILS", "Tracking AI models, vendors, capabilities and benchmarks, and separating credible evidence from hype when judging what is now possible.", (2, 6),
                ["model release notes", "public benchmarks and leaderboards", "system cards"], ["EMRG"], ["sc_0039"]),
        },
        "Responsibility": {
            "AI ethics and societal impact": skill("AETH", "Recognising and acting on ethical issues raised by AI: fairness, bias, transparency, labour and environmental effects, and impacts on human autonomy.", (1, 7),
                [], ["AIDE"], ["sc_0109", "sc_0111", "sc_0114", "sc_0115", "sc_0160"]),
            "AI law and regulation": skill("AREG", "Understanding and applying the law and regulation that governs AI development and use, including privacy, intellectual property, and AI-specific regulation across jurisdictions.", (1, 6),
                ["EU AI Act", "NZ Privacy Act 2020", "copyright and training-data rulings"], ["GOVN"], ["sc_0015", "sc_0044", "sc_0046", "sc_0048"]),
            "AI safety concepts": skill("ASAF", "Understanding risks from advanced AI and the methods used to reduce them: alignment, misuse prevention, evaluations for dangerous capabilities, and deployment safeguards.", (1, 7),
                ["frontier safety frameworks", "system cards"], [], []),
        },
    },
    "Working with AI": {
        "Communicating with AI": {
            "Instructing AI": skill("INST", "Communicating intent to AI systems: framing the task, supplying context, examples and constraints, and iterating to get useful results.", (1, 6),
                ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "project and custom instructions"], [], ["sc_0010", "sc_0097", "sc_0135", "sc_0001"]),
            "Output verification": skill("VERI", "Critically evaluating AI output before relying on it: checking facts, sources, reasoning, code and figures, and matching the depth of checking to the consequences.", (1, 5),
                ["citation checking", "cross-model comparison", "running generated code and tests"], [], ["sc_0011", "sc_0100", "sc_0136"]),
            "Information hygiene with AI": skill("PRIV", "Protecting personal, client and confidential information when using AI: knowing what data goes where, how it is retained or trained on, and choosing settings and tools accordingly.", (1, 5),
                ["data retention settings", "enterprise vs consumer plans", "local models"], ["SCPE"], ["sc_0041", "sc_0117"]),
        },
        "Applying AI to work": {
            "AI-assisted writing": skill("WRIT", "Using AI to draft, edit, summarise, translate and adapt written communication while keeping accuracy, voice and accountability.", (1, 5),
                ["Claude", "ChatGPT", "Gemini in Workspace", "Copilot in Word/Outlook"], [], ["sc_0106"]),
            "AI-assisted research": skill("RSRC", "Using AI to find, read, synthesise and critically assess sources, from quick lookups to multi-source research reports.", (1, 5),
                ["deep research modes", "Perplexity", "NotebookLM", "Elicit"], [], ["sc_0063"]),
            "AI-assisted data analysis": skill("ADAN", "Using AI to explore, analyse, visualise and explain data, with checks on the correctness of the analysis.", (1, 5),
                ["code-interpreter tools", "Copilot in Excel", "Julius", "notebook assistants"], ["DAAN"], ["sc_0055", "sc_0064"]),
            "AI media creation": skill("MEDI", "Creating and editing images, audio, video, slides and designs with generative AI, including rights, disclosure and quality control.", (1, 5),
                ["Midjourney", "image generation in chat assistants", "ElevenLabs", "Veo", "Runway"], [], ["sc_0103", "sc_0161"]),
            "AI in workplace applications": skill("OFFC", "Using AI features built into office suites and business applications (documents, spreadsheets, email, meetings, CRM) effectively and within organisational policy.", (1, 5),
                ["Microsoft 365 Copilot", "Gemini for Workspace", "Slack AI", "meeting transcription"], [], ["sc_0012", "sc_0140"]),
            "Learning with AI": skill("LERN", "Using AI as a tutor and study partner to learn new subjects and skills, while guarding against shallow understanding and over-reliance.", (1, 4),
                ["study modes", "NotebookLM", "Khanmigo"], [], []),
        },
        "Personal and home AI": {
            "Personal AI assistants": skill("PERS", "Using AI assistants to manage personal life: correspondence, scheduling, finances, health and fitness data, memory and personal knowledge, with attention to privacy.", (1, 5),
                ["assistant memory", "calendar and email connectors", "wearable data tools"], [], []),
            "Home and device agent coordination": skill("HOME", "Coordinating AI across home devices and services (voice assistants, smart home automation, appliances, vehicles) so they work together safely and reliably.", (1, 5),
                ["Home Assistant", "Alexa+", "Google Home with Gemini", "Matter"], [], []),
        },
    },
    "Delegating to AI agents": {
        "Delegation": {
            "Task delegation": skill("DELG", "Deciding what work to hand to AI agents and how to break it down, split between agent-executable and human-reserved parts, and specify done.", (1, 6),
                ["agent modes in chat assistants", "coding agents", "browser agents"], ["JADN"], ["sc_0134", "sc_0139", "sc_0142"]),
            "Agent supervision": skill("SUPV", "Keeping appropriate human control when AI acts on your behalf: setting permissions and limits, checking before acting on results, intervening, and reserving consequential decisions.", (1, 6),
                ["approval prompts", "permission modes", "audit logs"], [], ["sc_0137", "sc_0144", "sc_0118"]),
        },
        "Configuration": {
            "Agent configuration": skill("ACFG", "Setting up AI assistants and no- or low-code agents for specific purposes: projects, custom agents, connectors, scheduled tasks and triggers.", (2, 5),
                ["Claude Projects", "custom GPTs", "Copilot Studio", "scheduled tasks"], [], ["sc_0143"]),
            "Context and memory management": skill("CTXM", "Managing what an AI knows while it works: curating documents and project knowledge, memory, and summaries so long-running work stays accurate.", (2, 6),
                ["project knowledge", "assistant memory", "CLAUDE.md / AGENTS.md files"], [], ["sc_0001", "sc_0150"]),
            "AI workflow automation": skill("WFAU", "Building automations that combine AI steps with other applications to run recurring work reliably.", (2, 6),
                ["n8n", "Zapier", "Make", "Power Automate"], ["BPRE"], ["sc_0138", "sc_0145"]),
        },
    },
    "Building with AI": {
        "AI-assisted development": {
            "AI-assisted software development": skill("AISD", "Using AI assistants and coding agents in the software development cycle: writing, explaining, reviewing, testing and refactoring code while owning its quality.", (1, 6),
                ["Claude Code", "GitHub Copilot", "Cursor", "OpenAI Codex"], ["PROG"], ["sc_0022", "sc_0069"]),
            "Agentic software delivery": skill("AGSD", "Organising software delivery around agents: spec-driven development, parallel agents, agents in CI/CD, and review and merge controls for agent-produced change.", (3, 7),
                ["background coding agents", "agents in CI pipelines", "agent pull-request review"], ["RELM", "DEPL"], ["sc_0068"]),
        },
        "AI application engineering": {
            "LLM application engineering": skill("LLMA", "Building applications on model APIs: structured output, tool calling, streaming, conversation state, error handling and cost control.", (2, 6),
                ["Claude API", "OpenAI API", "Gemini API", "Vercel AI SDK"], ["PROG", "SWDN"], ["sc_0107", "sc_0006", "sc_0104"]),
            "Retrieval and knowledge systems": skill("RAGS", "Designing systems that ground AI in organisational knowledge: search, embeddings, retrieval pipelines, knowledge graphs and their evaluation.", (3, 6),
                ["vector databases", "hybrid search", "GraphRAG"], ["IRMG"], ["sc_0002", "sc_0098", "sc_0008"]),
            "Agent engineering and orchestration": skill("AGEN", "Designing and building agents and multi-agent systems: control loops, planning, state, sub-agents, inter-agent communication and failure handling.", (3, 7),
                ["Claude Agent SDK", "OpenAI Agents SDK", "LangGraph", "A2A protocol"], ["SWDN", "ARCH"], ["sc_0007", "sc_0105", "sc_0141", "sc_0149"]),
            "Agent capability design": skill("ACAP", "Designing the reusable capabilities agents use (packaged skills and instructions, tool definitions, connectors and servers) so agents do specific tasks reliably and safely.", (2, 7),
                ["Agent Skills (SKILL.md)", "Model Context Protocol servers", "plugins"], [], ["sc_0151"]),
        },
        "AI quality and operations": {
            "AI evaluation": skill("EVAL", "Measuring AI system quality: test sets, graders, human review, red-teaming and regression tracking for models, prompts and agents.", (2, 7),
                ["eval harnesses", "LLM-as-judge", "agent task benchmarks"], ["TEST", "NFTS"], ["sc_0080", "sc_0152"]),
            "AI security": skill("AISC", "Protecting AI systems and their users from attack and misuse: prompt injection, data exfiltration, tool and supply-chain risk, and permission design.", (2, 7),
                ["OWASP Top 10 for LLM applications", "sandboxing", "MITRE ATLAS"], ["SCTY", "VUAS"], ["sc_0005", "sc_0101", "sc_0147", "sc_0154"]),
            "AI operations and observability": skill("LOPS", "Running AI systems in production: tracing, monitoring, cost and latency management, incident handling and change control for models and prompts.", (3, 6),
                ["Langfuse", "OpenTelemetry for LLMs", "model gateways"], ["ITOP", "USUP"], ["sc_0076", "sc_0079", "sc_0108", "sc_0153"]),
            "Model selection": skill("MSEL", "Choosing models and deployment options for a purpose on evidence: capability, cost, latency, privacy, licensing and vendor risk.", (2, 6),
                ["frontier API models", "open-weight models", "model routers"], [], ["sc_0014", "sc_0019"]),
        },
    },
    "Building AI models": {
        "Data and modelling": {
            "Data preparation for AI": skill("DPRE", "Collecting, cleaning, labelling, generating and documenting data for training and evaluating AI.", (2, 6),
                ["labelling platforms", "synthetic data generation", "dataset cards"], ["DENG", "DATM"], ["sc_0021", "sc_0052", "sc_0009"]),
            "Predictive modelling": skill("CLML", "Building and validating classical machine learning models for prediction, classification, forecasting and anomaly detection.", (2, 7),
                ["scikit-learn", "XGBoost", "AutoML"], ["MLNG", "DATS"], ["sc_0119", "sc_0120", "sc_0122", "sc_0126"]),
            "Deep learning development": skill("DLDV", "Designing and training neural networks, including reinforcement learning, for vision, language, audio and other domains.", (3, 7),
                ["PyTorch", "JAX"], ["MLNG"], ["sc_0123", "sc_0124", "sc_0127"]),
            "Model adaptation": skill("MADP", "Adapting pre-trained models: fine-tuning, preference tuning, distillation and quantisation, and evaluating the result.", (3, 7),
                ["LoRA", "hosted fine-tuning APIs", "Hugging Face TRL"], ["MLNG"], ["sc_0003", "sc_0102", "sc_0125"]),
            "Model interpretability": skill("INTP", "Explaining model behaviour: feature attribution, probing and mechanistic interpretability.", (3, 7),
                ["SHAP", "sparse autoencoders"], ["MLNG"], ["sc_0017", "sc_0128"]),
        },
        "Platforms and research": {
            "ML operations": skill("MLOP", "Deploying, serving and maintaining models in production, including local and edge inference, retraining and drift monitoring.", (3, 6),
                ["vLLM", "Ollama", "MLflow", "Kubernetes"], ["ITOP", "RELM"], ["sc_0081", "sc_0086", "sc_0088", "sc_0089", "sc_0090", "sc_0093"]),
            "AI compute and infrastructure": skill("ACMP", "Planning and operating compute for AI: accelerators, clusters, cloud capacity, cost and energy.", (3, 7),
                ["GPU and TPU clouds", "cluster schedulers"], ["HPCC", "CPMG"], ["sc_0082", "sc_0084", "sc_0085"]),
            "AI research": skill("AIRS", "Creating new AI knowledge and methods through formal research, and publishing and replicating results.", (4, 7),
                ["arXiv", "open research code"], ["RSCH"], []),
        },
    },
    "Physical and embodied AI": {
        "Sensing and perception": {
            "Machine perception": skill("PERC", "Applying AI to interpret sensor data (camera, lidar, radar, audio) for detection, tracking, mapping and scene understanding.", (1, 7),
                ["vision-language models", "YOLO", "SLAM"], [], []),
            "Edge and IoT AI": skill("EDGE", "Running AI on constrained devices and sensor networks, balancing accuracy, power, latency and connectivity.", (2, 6),
                ["NVIDIA Jetson", "Raspberry Pi AI kits", "TinyML"], ["RESD"], []),
        },
        "Acting in the world": {
            "Robotics and embodied AI": skill("ROBO", "Applying AI to machines that sense and act in the physical world: perception, planning, control and learning for robots, with attention to physical safety.", (1, 7),
                ["ROS 2", "NVIDIA Isaac", "vision-language-action models", "domestic and warehouse robots"], ["RESD", "SFEN"], []),
            "Autonomous vehicles and mobility": skill("AUTV", "Using, supervising, developing or assuring AI that drives or pilots vehicles and drones.", (1, 7),
                ["robotaxi services", "driver-assistance systems", "autonomous drones"], ["SFEN", "SFAS"], []),
            "Human–robot interaction and safety": skill("HRIS", "Designing and assuring safe, understandable interaction between people and AI-driven machines.", (2, 7),
                ["ISO 10218", "ISO/TS 15066", "UL 4600"], ["SFAS", "HCEV"], []),
            "Simulation and digital twins": skill("SIMU", "Using simulation and digital twins to train, test and validate AI systems that act physically.", (3, 7),
                ["Isaac Sim", "MuJoCo", "CARLA"], [], []),
        },
    },
    "Leading AI adoption": {
        "Strategy and governance": {
            "AI strategy and value": skill("ASTR", "Deciding where AI creates value for an organisation, setting direction and investment, and measuring results.", (4, 7),
                [], ["ITSP", "INOV", "INVA"], ["sc_0024", "sc_0025", "sc_0027", "sc_0030", "sc_0033", "sc_0035", "sc_0038"]),
            "AI governance and risk": skill("AGOV", "Establishing policy, accountability, risk management and assurance for AI use and development.", (3, 7),
                ["ISO/IEC 42001", "NIST AI RMF"], ["GOVN", "BURM", "AIDE"], ["sc_0029", "sc_0043", "sc_0045", "sc_0112", "sc_0113", "sc_0156"]),
            "AI procurement": skill("APRO", "Evaluating, buying and managing AI products and services, including contract terms for data, IP, liability and model change.", (3, 6),
                [], ["SORC", "SUPP"], ["sc_0028"]),
        },
        "People and change": {
            "Work redesign for AI": skill("JOBR", "Redesigning jobs, processes and teams around AI, including hybrid human–agent teams.", (3, 7),
                [], ["JADN", "ORDI"], ["sc_0142", "sc_0148"]),
            "Enabling others with AI": skill("ENAB", "Teaching, coaching and building communities of practice so others adopt AI well.", (2, 7),
                [], ["TMCR", "ETDL"], ["sc_0023", "sc_0036", "sc_0146"]),
            "AI change leadership": skill("ACHG", "Leading organisational and cultural change as AI alters how work is done.", (4, 7),
                [], ["CIPM"], ["sc_0040", "sc_0159"]),
        },
    },
}

# Further appliedAI mappings. Its generic programming, software design and data
# engineering components (e.g. sc_0051-sc_0075, sc_0129-sc_0133) are left
# unmapped on purpose: they are not AI-specific and belong to SFIA's PROG, SWDN,
# DENG etc.
EXTRA_AAI = {
    "LLMA": ["sc_0004", "sc_0056"],
    "SUPV": ["sc_0013", "sc_0099"],
    "AREG": ["sc_0016", "sc_0018", "sc_0049", "sc_0050", "sc_0116"],
    "AGOV": ["sc_0042", "sc_0096", "sc_0110", "sc_0155", "sc_0157", "sc_0158"],
    "AETH": ["sc_0047", "sc_0077", "sc_0078"],
    "ASTR": ["sc_0026", "sc_0031", "sc_0032", "sc_0034", "sc_0037"],
    "MLOP": ["sc_0083", "sc_0087", "sc_0091", "sc_0092", "sc_0094"],
    "ACMP": ["sc_0095"],
}

for _cat in TREE.values():
    for _sub in _cat.values():
        for _s in _sub.values():
            _s["map"]["appliedai"] += EXTRA_AAI.get(_s["code"], [])
            lo, hi = _s["level_range"]
            expected = {str(i) for i in range(lo, hi + 1)}
            if set(_s["levels"]) != expected:
                raise ValueError(f"{_s['code']}: levels {sorted(_s['levels'])} != range {lo}-{hi}")

if __name__ == "__main__":
    out = Path(__file__).with_name("skills.json")
    out.write_text(json.dumps(TREE, indent=2, ensure_ascii=False))
    codes = [s["code"] for c in TREE.values() for sc in c.values() for s in sc.values()]
    assert len(codes) == len(set(codes)), "duplicate codes"
    print(len(codes), "skills written to", out)
