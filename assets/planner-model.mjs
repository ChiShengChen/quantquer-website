export const industries = {
  semiconductor: ['半導體', 'Semiconductor'],
  consumer: ['消費電子', 'Consumer electronics'],
  manufacturing: ['製造', 'Manufacturing'],
  robotics: ['機器人', 'Robotics'],
  healthcare: ['醫療與照護', 'Healthcare'],
  finance: ['金融服務', 'Financial services'],
  academic: ['研究機構', 'Research institutions'],
  software: ['企業軟體', 'Enterprise software'],
  other: ['其他', 'Other'],
};

export const objectives = {
  automate: ['自動化工作流程', 'Automate a workflow'],
  model: ['開發 AI 模型', 'Develop an AI model'],
  optimize: ['最佳化模型效能', 'Optimize model performance'],
  deploy: ['在裝置上部署 AI', 'Deploy AI on a device'],
  agent: ['建置 AI Agent', 'Build an AI agent'],
  science: ['分析科學資料', 'Analyze scientific data'],
  compute: ['建置內部 AI 基礎設施', 'Build internal AI infrastructure'],
  quant: ['建置量化研究系統', 'Develop a quantitative research system'],
  product: ['開發新的 AI 產品', 'Build a new AI product'],
};

export const services = {
  'edge-ai': ['半導體與邊緣 AI', 'Semiconductor and Edge AI'],
  'generative-vision': ['晶片端生成式影像', 'On-device generative vision'],
  agent: ['AI Agent 與工作流程', 'AI agents and workflows'],
  'knowledge-base': ['企業知識庫', 'Enterprise knowledge bases'],
  research: ['可重現科研自動化', 'Reproducible research automation'],
  'photonic-simulation': ['光子運算與科學模擬', 'Photonics and scientific simulation'],
  'gpu-infrastructure': ['GPU 基礎設施', 'GPU infrastructure'],
  robotics: ['工業機器人與工程自動化', 'Industrial robotics and engineering automation'],
  'domain-rd': ['專業領域 AI 研發', 'Domain-specific AI R&D'],
};

const objectiveServices = {
  automate: 'agent', model: 'domain-rd', optimize: 'edge-ai', deploy: 'edge-ai',
  agent: 'agent', science: 'research', compute: 'gpu-infrastructure', quant: 'domain-rd', product: 'domain-rd',
};

const requirementGroups = {
  edge: {
    hardware: ['目標裝置與 Runtime', 'Target device and runtime'],
    backend: ['NPU、GPU 或 CPU', 'NPU, GPU or CPU'],
    resolution: ['輸入解析度與格式', 'Input resolution and format'],
    latency: ['延遲目標', 'Latency target'],
    fps: ['影格率目標', 'Frame rate target'],
    memory: ['記憶體上限', 'Memory ceiling'],
    power: ['功耗與散熱限制', 'Power and thermal constraints'],
    model: ['現有模型與版本', 'Existing model and version'],
  },
  agent: {
    workflows: ['工作流程數量與範圍', 'Workflow count and scope'],
    sources: ['資料來源與存取條件', 'Data sources and access'],
    tools: ['現有工具或系統', 'Existing tools and systems'],
    integration: ['必要的系統整合', 'Required integrations'],
    review: ['人工核准節點', 'Human approval gates'],
    evaluation: ['評測與驗收方式', 'Evaluation and acceptance criteria'],
    security: ['安全與權限要求', 'Security and permission requirements'],
  },
  science: {
    size: ['資料規模', 'Dataset size'],
    modalities: ['資料型態', 'Data modalities'],
    baseline: ['現有基準方法', 'Current baselines'],
    question: ['研究問題或假設', 'Research question or hypothesis'],
    metrics: ['驗收指標', 'Evaluation metrics'],
    reproducibility: ['重現性與環境要求', 'Reproducibility and environment'],
  },
  compute: {
    hardware: ['GPU 數量、型號與記憶體', 'GPU count, models and memory'],
    users: ['使用者數與權限', 'User count and access'],
    scheduling: ['排程與資源隔離', 'Scheduling and resource isolation'],
    deployment: ['部署環境', 'Deployment environment'],
    monitoring: ['監控、告警及恢復需求', 'Monitoring, alerting and recovery'],
  },
  engineering: {
    system: ['現有系統或設備', 'Existing systems or equipment'],
    integration: ['介面及部署環境', 'Interfaces and deployment'],
    acceptance: ['效能或驗收指標', 'Performance or acceptance criteria'],
  },
};

const groups = {
  'edge-ai': 'edge', 'generative-vision': 'edge', 'knowledge-base': 'agent', agent: 'agent',
  research: 'science', 'photonic-simulation': 'science', 'gpu-infrastructure': 'compute',
  robotics: 'engineering', 'domain-rd': 'engineering',
};

export const readiness = {
  none: ['尚無資料', 'No data available'],
  sample: ['少量可分享樣本', 'Small shareable sample'],
  labeled: ['已有標註資料', 'Existing labeled data'],
  production: ['現有正式環境資料', 'Existing production data'],
  regulated: ['資料受規範或具敏感性', 'Sensitive or regulated data'],
  collection: ['需要蒐集資料', 'Data collection needed'],
};

export const deliverables = {
  feasibility: ['可行性報告', 'Feasibility report'],
  architecture: ['技術架構', 'Technical architecture'],
  poc: ['概念驗證', 'Proof of concept'],
  benchmark: ['效能驗證報告', 'Benchmark report'],
  model: ['訓練後模型', 'Trained model'],
  deployment: ['部署套件', 'Deployment package'],
  production: ['正式系統', 'Production system'],
  source: ['原始碼', 'Source code'],
  maintenance: ['維護與支援', 'Maintenance and support'],
  documentation: ['技術文件', 'Technical documentation'],
};

export const constraints = {
  budget: ['可用預算範圍', 'Available budget range'],
  timeline: ['期望時程', 'Desired schedule'],
  hardware: ['硬體限制', 'Hardware constraints'],
  privacy: ['資料與隱私限制', 'Data and privacy requirements'],
  nda: ['NDA 需求', 'NDA requirements'],
  team: ['現有團隊及分工', 'Team and roles'],
  engagement: ['偏好合作模式', 'Preferred engagement model'],
};

export function initialService(prefill, objective) {
  if (Object.hasOwn(services, prefill)) return prefill;
  return Object.hasOwn(objectiveServices, objective) ? objectiveServices[objective] : 'domain-rd';
}

export function requirementFields(service) {
  return requirementGroups[groups[service]] ?? requirementGroups.engineering;
}

const clean = (value, limit) => typeof value === 'string'
  ? value.trim().replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').slice(0, limit)
  : '';

export function createBrief(draft, locale) {
  const language = locale === 'en' ? 1 : 0;
  const service = initialService(draft.service, draft.objective);
  const option = (dictionary, key) => Object.hasOwn(dictionary, key) ? dictionary[key][language] : '';
  const entries = (dictionary, input) => Object.entries(dictionary).flatMap(([key, label]) => {
    const answer = clean(input?.[key], 160);
    return answer ? [{ label: label[language], answer }] : [];
  });
  const tech = entries(requirementFields(service), draft.tech);
  const constraintsList = entries(constraints, draft.constraints);
  const selected = [...new Set(draft.deliverables ?? [])].filter(key => Object.hasOwn(deliverables, key));
  const readinessLabel = option(readiness, draft.readiness);
  const dataMissing = ['none', 'collection'].includes(draft.readiness);
  const regulated = draft.readiness === 'regulated';
  const fullDeployment = selected.includes('production') || selected.includes('deployment');
  const score = (fullDeployment ? 2 : 0) + (selected.includes('maintenance') ? 1 : 0)
      + (regulated ? 2 : 0) + (dataMissing ? 1 : 0) + (tech.length >= 5 ? 1 : 0);
  const complexity = (score >= 4 ? ['高', 'High'] : score >= 2 ? ['中', 'Medium'] : ['初步探索', 'Exploratory'])[language];
  const descriptions = {
    data: ['資料準備或蒐集會影響可行性與時程。', 'Data readiness or collection may affect feasibility and schedule.'],
    privacy: ['先對齊合規、存取與去識別化要求。', 'Agree on compliance, access and anonymization before data exchange.'],
    deploy: ['先定義驗收基線及部署環境。', 'Define the acceptance baseline and deployment environment.'],
    input: ['提供可合法使用的代表性資料、現有基準與可用環境。', 'Provide representative shareable data, the current baseline and available test environments.'],
    meeting: ['先安排技術需求會議，確認最小可驗證範圍。', 'Start with a technical scoping call to agree on the smallest verifiable scope.'],
    acceptance: ['哪些指標代表驗收成功？測試如何重現？', 'What counts as acceptance, and how can the test be reproduced?'],
    missing: ['哪些技術限制要在會議中補齊？', 'Which technical constraints should we clarify at the first meeting?'],
    suggested: ['可行性報告', 'Feasibility report'],
  };
  return {
    service,
    serviceLabel: option(services, service),
    industry: option(industries, draft.industry),
    objective: option(objectives, draft.objective),
    description: clean(draft.description, 550),
    tech,
    readiness: readinessLabel,
    deliverables: selected.length ? selected.map(key => deliverables[key][language]) : [descriptions.suggested[language]],
    constraints: constraintsList,
    complexity,
    score,
    risks: [dataMissing && descriptions.data, regulated && descriptions.privacy, fullDeployment && descriptions.deploy].filter(Boolean).map(pair => pair[language]),
    inputs: descriptions.input[language],
    questions: [descriptions.acceptance, ...(tech.length ? [] : [descriptions.missing])].map(pair => pair[language]),
    next: descriptions.meeting[language],
  };
}
