export const evidenceTypes = {
  delivery: ['已交付工程', 'Verified engineering delivery'],
  measured: ['實測基準', 'Measured benchmark'],
  reproducible: ['可重現實驗', 'Reproducible experiment'],
  research: ['公開研究', 'Public research'],
  prototype: ['互動原型', 'Interactive prototype'],
  illustration: ['示意展示', 'Illustrative demonstration'],
  development: ['研發中', 'In development'],
};

export const caseEvidence = {
  'industrial-robotics': { types: ['delivery', 'illustration'], solution: 'industrial-robotics', demo: 'robot-workcell' },
  'eeg-treatment-response': { types: ['research'], solution: 'scientific-ai' },
  'ngs-denoising': { types: ['illustration'], solution: 'scientific-ai' },
  'financial-intelligence': { types: ['illustration'], solution: 'financial-ai' },
  'enterprise-knowledge-arbitration': { types: ['measured', 'illustration'], solution: 'enterprise-ai', demo: 'knowledge-arbitration' },
  'floorplan-automation': { types: ['measured'], solution: 'industrial-robotics' },
  'fall-detection': { types: ['illustration'], solution: 'semiconductor-edge-ai' },
  'surgical-gauze-detection': { types: ['development'], solution: 'semiconductor-edge-ai' },
  'pig-behavior-tracking': { types: ['illustration'], solution: 'industrial-robotics' },
  'adaptive-physics-tutor': { types: ['illustration'], solution: 'enterprise-ai' },
  'on-device-generative-vision': { types: ['measured', 'reproducible'], solution: 'semiconductor-edge-ai' },
  'photonic-computing': { types: ['prototype'], solution: 'scientific-ai' },
  'gpu-orchestration': { types: ['measured', 'prototype'], solution: 'gpu-infrastructure' },
  'research-automation': { types: ['reproducible'], solution: 'scientific-ai' },
  'professional-speech-research': { types: ['illustration'], solution: 'scientific-ai' },
  'amm-rebalancing-research': { types: ['research', 'illustration'], solution: 'financial-ai' },
};
