export const studioDemos = [
  {
    id: 'reliability', route: '/labs/demos/reliability/', solution: '/solutions/ai-reliability/',
    related: '/labs/demos/knowledge-arbitration/',
    zh: {
      title: 'AI 可靠性實驗',
      description: '以同一組合成採購情境比較單代理基準與具約束驗證、修正、轉人工機制的多階段流程。',
      limits: '合成案例與規則模擬。此實驗不呼叫模型 API，Token、成本及延遲均按固定假設計算。',
      related: '操作文件仲裁',
    },
    en: {
      title: 'AI reliability experiment',
      description: 'Compare a single-agent baseline with a multi-stage workflow that checks constraints, repairs outputs and escalates when needed on the same synthetic procurement scenarios.',
      limits: 'Synthetic cases and rule-based simulation. Runs make no model API requests. Token, cost and latency values use fixed assumptions.',
      related: 'Try knowledge arbitration',
    },
  },
  {
    id: 'knowledge-arbitration', route: '/labs/demos/knowledge-arbitration/', solution: '/solutions/enterprise-ai/',
    related: '/work/enterprise-knowledge-arbitration/',
    zh: {
      title: '技術文件版本仲裁',
      description: '比對三份規格互相矛盾的合成文件，查看關鍵詞檢索與版本、適用條件及權威仲裁如何產生不同答案。',
      limits: '文件、設備與數據均為合成。兩種方法以預先標記的規格及可重現規則顯示引用取捨。',
      related: '閱讀企業知識案例',
    },
    en: {
      title: 'Technical document arbitration',
      description: 'Compare keyword retrieval with arbitration over version, scope and source authority when three synthetic technical documents disagree.',
      limits: 'All documents, equipment and figures are synthetic. Both workflows use annotated claims and repeatable rules to expose citation decisions.',
      related: 'Read the enterprise knowledge case',
    },
  },
  {
    id: 'robot-workcell', route: '/labs/demos/robot-workcell/', solution: '/solutions/industrial-robotics/',
    related: '/work/industrial-robotics/',
    zh: {
      title: '機器人工作站概念選型',
      description: '在合成廠區比較機器人、負載與三種配置。檢查可達半徑、路線與障礙淨距，以及估計循環。',
      limits: '合成廠區與概念機器人。以平面幾何及假設等速估算，供比較候選方案。',
      related: '閱讀工業機器人案例',
    },
    en: {
      title: 'Robot workcell concept selection',
      description: 'Compare robot candidates, payloads and three layouts on a synthetic factory floor. Inspect reach, route clearance and estimated cycle times.',
      limits: 'Synthetic floor and concept robots. The comparison uses planar geometry and assumed constant speed.',
      related: 'Read the industrial robotics case',
    },
  },
];

export const studioDemoRoutes = studioDemos.map(demo => demo.route);
