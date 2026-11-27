export const projectTypes = {
  assessment: ['技術評估', 'Technical assessment'],
  'edge-ai': ['晶片端 AI', 'Edge AI'],
  'generative-vision': ['生成式影像', 'Generative vision'],
  agent: ['AI Agent 與可靠性', 'AI agents and reliability'],
  'knowledge-base': ['企業知識系統', 'Enterprise knowledge systems'],
  'gpu-infrastructure': ['GPU 運算基礎設施', 'GPU infrastructure'],
  robotics: ['工業機器人', 'Industrial robotics'],
  'photonic-simulation': ['光子模擬', 'Photonic simulation'],
  research: ['科學與研究工程', 'Scientific and research engineering'],
  'domain-rd': ['客製化研發', 'Custom engineering and R&D'],
  financial: ['金融資料與研究系統', 'Financial data and research systems'],
  other: ['其他', 'Other'],
};

// Field order is shared by HTML, the fallback brief and the server validator.
export const fields = [
  { name: 'name', type: 'text', limit: 100, required: true, autocomplete: 'name', labels: ['姓名', 'Name'] },
  { name: 'company', type: 'text', limit: 160, required: true, autocomplete: 'organization', labels: ['公司或組織', 'Company or organization'] },
  { name: 'email', type: 'email', limit: 180, required: true, autocomplete: 'email', labels: ['工作信箱', 'Work email'] },
  { name: 'industry', type: 'text', limit: 120, labels: ['產業', 'Industry'] },
  { name: 'projectType', type: 'select', limit: 40, required: true, labels: ['專案類型', 'Project type'] },
  { name: 'challenge', type: 'textarea', limit: 2400, required: true, labels: ['技術挑戰', 'Technical challenge'] },
  { name: 'deliverables', type: 'text', limit: 300, labels: ['預期交付物', 'Expected deliverables'] },
  { name: 'timeline', type: 'text', limit: 100, labels: ['目標時程', 'Target timeline'] },
  { name: 'budget', type: 'text', limit: 120, labels: ['預算範圍（選填）', 'Budget range (optional)'] },
  { name: 'notes', type: 'textarea', limit: 1800, labels: ['補充說明', 'Additional notes'] },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateContact(input = {}) {
  const values = {};
  const errors = {};
  for (const { name, type, limit, required } of fields) {
    const raw = Object.hasOwn(input, name) ? input[name] : '';
    const value = typeof raw === 'string' ? raw.trim() : '';
    values[name] = value;
    if (typeof raw !== 'string' || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (type !== 'textarea' && /[\r\n]/.test(value))) errors[name] = 'invalid';
    else if (!value && required) errors[name] = 'required';
    else if (value.length > limit) errors[name] = 'length';
    else if (value && type === 'email' && !emailPattern.test(value)) errors[name] = 'email';
    else if (value && type === 'select' && !Object.hasOwn(projectTypes, value)) errors[name] = 'invalid';
  }
  return { values, errors };
}

export function contactBrief(values, locale) {
  const index = locale === 'en' ? 1 : 0;
  return fields.filter(field => values[field.name]).map(({ name, labels }) => {
    const value = name === 'projectType' ? projectTypes[values[name]][index] : values[name];
    return `${labels[index]}: ${value}`;
  }).join('\n');
}
