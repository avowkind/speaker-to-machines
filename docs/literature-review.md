# AI Skills Framework: literature and prior-art review

Date: 30 September 2026. Scope: has anyone already built an SFIA-style framework for AI skills (skills x graded levels, with a description for every level of every skill) covering the range from core ML to agent orchestration, everyday tool use, home agents and physical AI?

## Short answer

Not in that form. Several AI frameworks exist and one (appliedAI Institute, 2026) overlaps heavily in content, but none combines all four of:

1. SFIA's structure: each skill has its own description for each responsibility level, and the levels are defined by generic attributes (autonomy, influence, complexity, knowledge).
2. Coverage from ML research through to agent and skill design, AI-assisted software development, and office use.
3. Personal and home agent coordination.
4. Physical-world AI (robotics, autonomous vehicles).

Items 3 and 4 are missing everywhere I looked. Item 1 exists only in SFIA itself, which covers AI thinly and on purpose.

## What exists

### SFIA 9 (SFIA Foundation, Oct 2024)
- Seven responsibility levels (not eight). Only a few skills are AI-specific: Machine learning (MLNG), AI and data ethics (AIDE), plus Job analysis and design (JADN) for redesigning roles around AI.
- Handles AI mainly through "views" that regroup existing skills: AI literacy, building models, MLOps, automate/assist/augment, organisation design and so on. It also maps to CEN CWA 18398.
- Leaves out on purpose: prompting and generative AI tool use, agentic systems, robotics and tool-specific skills. It argues that durable capabilities matter more than fast-moving technology.
- Licence: free for personal and internal use. Copying, redistributing and derived works need written permission. The structure and text are both claimed as SFIA Foundation IP, so the new framework must be written from scratch: our own level definitions in our own words, with no SFIA text.

### appliedAI Institute for Europe: AI Skills Framework (GitHub, last updated 31 Aug 2026; CC BY-SA 4.0)
- The closest prior art. It has 161 "skill components" in a CSV, each with an id, description, purpose, domain and keywords in English and German.
- Four purposes: Use, Integrate, Build and Frame AI. Its domains include GenAI proficiency, MLOps, data, regulation and ethics, plus four agentic domains with 28 components between them. Those agentic components cover task decomposition, briefing agents, multi-agent architecture, memory, tool permissions, prompt-injection defence, observability and human-agent teams.
- It has five generic proficiency levels (Unknown, Knowledge, Application, Adaptation, Mastery) but no description per level for each component. That is the main structural difference from SFIA.
- No robotics or physical AI, and no personal or home use.
- Reusing its data would make our dataset CC BY-SA as well.

### Alan Turing Institute: AI Skills for Business Competency Framework (DSIT / Innovate UK BridgeAI)
- v1 Nov 2023, v2 May 2024 (Zenodo). v3 went out for national consultation Dec 2025 and closed Jan 2026. A later "launched" announcement exists but I haven't confirmed its date.
- Four personas: AI Citizen, Worker, Professional, Leader. Five dimensions (privacy and stewardship, specification and engineering, problem definition, problem solving, evaluation). About 40 competencies.
- Four levels borrowed from the UK DDaT framework: Awareness, Working, Practitioner, Expert.
- Aimed at business adoption. Agentic AI isn't explicitly covered in the versions I read.

### CEN CWA 18398: AI professional role profiles and educational profiles (CEN, published Sept 2026)
- Grew out of the EU ARISA project and is built on the e-CF (EN 16234) role-profile approach. It is organised around role profiles, not a skills-by-levels grid.
- I haven't seen the text: the number of profiles and whether it covers agentic AI are unverified.

### Citizen and education literacy frameworks
- UNESCO AI Competency Frameworks for Students and for Teachers (2024) have three progression stages, for students roughly understand, apply, create.
- EU–OECD AILit framework, for primary and secondary education (review draft May 2025, final 2026).
- DigComp 3.0 (EU JRC, late 2025) builds AI into general digital competence for citizens.
- Anthropic's AI Fluency "4D" (Delegation, Description, Discernment, Diligence) describes how a person works with AI. It has no levels and no role structure.
- These cover the citizen end well, and the "home use" strand of the new framework can draw on them. None of them grades professional responsibility.

### Other
- "The AI Pyramid" (arXiv 2601.06500, Jan 2026) proposes three tiers: AI Native, AI Foundation, AI Deep. The authors say explicitly that it describes how capability is spread across a workforce, not a personal career ladder.
- The US DoD Cyber Workforce Framework added AI and data work roles in 2023. It is role-based and aimed at defence.
- The Data Lab (Scotland) published a 2025 Data & AI Skills Framework. I haven't examined it.
- For robotics and autonomous systems I found only single-role competency profiles (e.g. ECO Canada's Robotics Engineer) and course syllabuses. I found no framework that grades robotics skills and treats them as AI skills.

### Ghandour, "From Digital Competence to Demonstrated Digital Capability" (arXiv 2609.19406, 16 Sept 2026; Auckland)
- This is a conceptual paper. It positions the International Digital Driving License (IDDL) against DigComp, UNESCO's Digital Literacy Global Framework and UNESCO's AI Competency Framework for Students. It is not an AI skills framework.
- The UNESCO student framework has 12 competencies across four dimensions (human-centred mindset, ethics of AI, AI techniques and applications, AI system design) and three levels: Understand, Apply, Create. DigComp 3.0 kept the 2.2 architecture (5 areas, 21 competencies), revised the proficiency levels and made AI transversal.
- IDDL has three domains (Digital Skills, Cybersecurity Awareness, AI Competency), 12 subdomains and 36 concepts. It assesses them with a Knowledge–Capability–Reflection model: what you know, what you are observed doing in an authentic task, and why you did it.
- Two ideas are directly useful here:
  (a) "Human agency under AI delegation" as its own construct, separate from AI literacy. Its observable indicators are verification before reliance, constraint setting, intervention, refusal, justified acceptance, protecting sensitive data and keeping consequential authority. This is a good basis for the agent-coordination skills at the lower levels.
  (b) The split between defined competence and demonstrated capability. SFIA-style frameworks only define competence, so it's worth writing observable evidence indicators for each level from the start.
- It covers citizens only, with no professional responsibility levels and no roles. The paper cites no machine-readable dataset.

### Not read
- The full text of CWA 18398 and Turing v3.

## Positioning for the new framework

Where it adds something new:
- SFIA's skills-by-levels grid, with a description in every cell, applied across the whole AI range.
- Two domains nobody covers: physical AI, and personal/home agent coordination.
- Agent and skill design treated as a craft of its own (designing SKILL.md-style capabilities, orchestration, evaluation), not just "agentic proficiency".

The strongest case against building it:
- SFIA's stated reason for avoiding AI-specific skills: tool-level skills date within months, and a framework that tracks them needs constant maintenance.
- appliedAI already publishes an open, recent, machine-readable dataset that covers most of the professional content, agentic work included. Extending it (adding per-level descriptors plus robotics and home domains) would be cheaper than starting over, at the cost of CC BY-SA on the data.
- Leaders and HR are converging on the Turing/DDaT personas and CWA 18398. A fourth parallel taxonomy adds cost for users unless it maps cleanly to those.

Implications for design:
- Split the framework into two layers: stable skills with level descriptors, and a separately versioned layer of application areas and technology examples. That keeps volatility out of the core.
- Give each skill level observable evidence indicators, following IDDL's defined-versus-demonstrated argument. This also makes the PD tool more useful for assessment.
- Publish mappings to SFIA 9 skill codes (a reference by code is not a copy), to the appliedAI component ids, to the Turing personas and to CWA 18398.
- Watch the naming. In 2026 "agent skills" usually means packaged capabilities for AI agents (the Agent Skills standard, OWASP Agentic Skills Top 10), not human competencies, and a skill about designing agent skills will need careful wording.

## PD tool fork notes
- niwa/sfia-position-description-tool was last committed Jan 2025. It is licensed under Creative Commons NZ, non-commercial with attribution. It is a static site (index.html, functions.js) driven by json_source*.json files that contain SFIA content.
- A public fork should remove the SFIA JSON files and ship only the new framework's data, in keeping with SFIA's no-redistribution terms.

## Sources
- SFIA, a framework for AI skills: https://sfia-online.org/en/tools-and-resources/ai-skills-framework
- SFIA AI view summary chart: https://sfia-online.org/en/sfia-9/sfia-views/sfia-9-multi-view/sfia-ai-en-summary-chart-with-roles
- SFIA 9 Machine learning: https://sfia-online.org/en/sfia-9/skills/machine-learning
- SFIA licensing: https://sfia-online.org/en/about-sfia/licensing-sfia/using-and-licensing-sfia
- appliedAI AI Skills Framework: https://github.com/aai-institute/ai-skills-framework
- Turing AI Skills for Business: https://www.turing.ac.uk/skills/collaborate/ai-skills-business-framework
- Turing framework draft PDF (2023): https://www.turing.ac.uk/sites/default/files/2023-11/final_bridgeai_framework.pdf
- Computer Weekly on the Turing framework: https://www.computerweekly.com/news/366561592/Government-sets-out-AI-training-framework-for-business
- CEN CWA 18398 announcement: https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-09-02-cwa_arisa/
- CWA 18398 PDF: https://www.cencenelec.eu/media/CEN-CENELEC/CWAs/RI/2026/cwa_18398_2026.pdf
- DigComp 3.0: https://joint-research-centre.ec.europa.eu/scientific-activities/key-competences-lifelong-learning/digital-competence-framework-digcomp/digcomp-30_en
- OECD/EC, Empowering Learners for the Age of AI (2026): https://www.oecd.org/content/dam/oecd/en/publications/reports/2026/06/empowering-learners-for-the-age-of-ai_2f8315e7/65cd27d4-en.pdf
- UNESCO AI competency framework for students: https://www.unesco.org/en/articles/ai-competency-framework-students
- UNESCO AI competency framework for teachers: https://www.unesco.org/en/articles/ai-competency-framework-teachers
- Anthropic AI Fluency course: https://academy.claude.com/courses/ai-fluency-framework-foundations
- Ghandour (2026), arXiv 2609.19406 (PDF supplied by Andrew): https://arxiv.org/abs/2609.19406
- The AI Pyramid, arXiv 2601.06500: https://arxiv.org/abs/2601.06500v1
- DoD digital workforce (CDAO): https://www.ai.mil/Initiatives/DoD-Digital-Workforce/
- The Data Lab 2025 framework: https://thedatalab.com/academy/professional-development/skills-framework/2025-framework/
- ECO Canada Robotics Engineer profile: https://eco.ca/wp-content/uploads/2024/04/Robotics-Engineer_GRAPHICS_V1_MB.pdf
- OWASP Agentic Skills Top 10: https://owasp.org/projects/agentic-skills-top-10
- NIWA PD tool: https://github.com/niwa/sfia-position-description-tool
