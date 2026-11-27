export const labCategories = {
  reliability: ['AI 可靠性', 'AI Reliability'],
  research: ['AI 研究自動化', 'AI Research Automation'],
  compute: ['運算系統', 'Compute Systems'],
  science: ['科學運算', 'Scientific Computing'],
  finance: ['金融智慧', 'Financial Intelligence'],
  applied: ['應用 AI 系統', 'Applied AI Systems'],
};

export const labMaturity = {
  open: ['開源', 'Open source'],
  public: ['程式碼公開', 'Public source'],
  research: ['研究原型', 'Research prototype'],
  demo: ['技術展示', 'Technical demonstration'],
  internal: ['內部工具', 'Internal tooling'],
  development: ['開發中', 'In development'],
};

const offer = {
  edge: '/solutions/semiconductor-edge-ai/',
  reliability: '/solutions/ai-reliability/',
  science: '/solutions/scientific-ai/',
  gpu: '/solutions/gpu-infrastructure/',
  finance: '/solutions/financial-ai/',
  enterprise: '/solutions/enterprise-ai/',
  robotics: '/solutions/industrial-robotics/',
};

export const labProjects = [
  {
    id: 'paper-evidence', category: 'research', maturity: 'open', name: 'Paper Evidence',
    purpose: ['將論文的引文、數字與推論鏈連回可檢查的原文證據。', 'Trace citations, numbers, and reasoning in a research workflow back to inspectable source text.'],
    architecture: ['文獻解析 → 引文定位 → 數字上下文查核 → 證據紀錄', 'Document parsing → quote location → numeric context check → evidence record'],
    evidence: ['固定版本的開源核心在四組合成引文上重跑。', 'The pinned open-source core was replayed on four synthetic quotes.'],
    repo: 'https://github.com/ChiShengChen/paper-evidence', demo: '/labs/evidence/research/', legacy: true, offer: offer.science,
  },
  {
    id: 'tokenbench', category: 'reliability', maturity: 'public', name: 'TokenBench',
    purpose: ['以同一批任務比較 AI 工具的 token 用量與呼叫紀錄。', 'Compare token usage and call traces for AI tools on the same tasks.'],
    architecture: ['測試任務 → 執行紀錄 → 用量摘要', 'Task fixtures → execution traces → usage summaries'],
    evidence: ['公開程式與可檢查的任務格式。', 'Public source and inspectable task format.'],
    repo: 'https://github.com/ChiShengChen/tokenbench', offer: offer.reliability,
  },
  {
    id: 'sevencheck', category: 'reliability', maturity: 'open', name: 'SevenCheck',
    purpose: ['讓引文、數字及其他可程式化的輸出檢查進入文字審閱流程。', 'Bring quote, number, and other programmatic output checks into text review.'],
    architecture: ['文字輸入 → 規則檢查 → 診斷報告', 'Text input → rule checks → diagnostic report'],
    evidence: ['公開程式與範例。', 'Public source and examples.'],
    repo: 'https://github.com/ChiShengChen/sevencheck', offer: offer.reliability,
  },
  {
    id: 'autoresearch', category: 'research', maturity: 'internal', name: 'AutoResearch',
    purpose: ['將文獻監測、假設與實驗紀錄串成可供人工複核的研究流程。', 'Connect literature monitoring, hypotheses, and experiment records in a workflow for human review.'],
    architecture: ['來源監測 → 假設與實驗 → 紀錄 → 人工複核', 'Source monitoring → hypotheses and experiments → records → human review'],
    evidence: ['公開功能概述。', 'Public capability overview.'],
    offer: offer.science,
  },
  {
    id: 'gpu-scheduler', category: 'compute', maturity: 'demo', name: ['GPU 排程與資源控制', 'GPU Scheduling and Resource Control'],
    purpose: ['觀察 GPU 工作准入、程序 VRAM 取樣與 CPU 工作並行。', 'Inspect GPU job admission, process-level VRAM samples, and concurrent CPU work.'],
    architecture: ['工作提交 → 資源准入 → 執行與取樣 → 事件重播', 'Job submission → admission → execution and sampling → event replay'],
    evidence: ['單 GPU 工作站上的三件受控工作與記憶體取樣。', 'Three controlled jobs and memory samples from a single-GPU workstation.'],
    demo: '/labs/evidence/gpu/', legacy: true, offer: offer.gpu,
  },
  {
    id: 'photonics', category: 'science', maturity: 'research', name: ['光子網路故障模擬', 'Photonic Mesh Fault Simulation'],
    purpose: ['檢視相位偏移和局部功率衰減對四級光子網路的影響。', 'Inspect effects of phase offsets and local attenuation in a four-stage photonic mesh.'],
    architecture: ['複數輸入 → 理想 MZI 網路 → 指定故障 → 輸出比較', 'Complex input → ideal MZI mesh → configured fault → output comparison'],
    evidence: ['互動模擬、可下載的數值模型與測試。', 'Interactive simulation, downloadable numerical model, and tests.'],
    demo: '/labs/evidence/photonics/', legacy: true, offer: offer.science,
  },
  {
    id: 'qasa', category: 'science', maturity: 'research', name: 'QASA',
    purpose: ['探索在文字模型的注意力機制中使用混合量子與經典模型。', 'Explore a hybrid quantum and classical component in a text model’s attention mechanism.'],
    architecture: ['文字編碼 → 量子電路處理單一注意力層的值投影 → 經典輸出', 'Text encoding → quantum circuit for a value projection in one attention layer → classical output'],
    evidence: ['公開研究程式與經典模型對照設定。', 'Public research code and a classical comparison configuration.'],
    repo: 'https://github.com/ChiShengChen/QASA', offer: offer.science,
  },
  {
    id: 'hypogen', category: 'finance', maturity: 'development', name: 'Hypogen',
    purpose: ['保留金融事件研究的來源、假設與時間點，供後續檢視。', 'Preserve sources, hypotheses, and time cutoffs for review in financial event research.'],
    architecture: ['事件與來源 → 假說分支 → 情境比較 → 複核', 'Event and sources → hypothesis branches → scenario comparison → review'],
    evidence: ['公開研究方法說明與相關事件研究範例來源。', 'Public methodology and a related event research repository.'],
    notes: ['/financial-intelligence/', '/financial-intelligence/#english'], notesLegacy: true,
    repo: 'https://github.com/ChiShengChen/hypogen-event-research',
    repoLabel: ['相關公開範例', 'Related public examples'], offer: offer.finance,
  },
  {
    id: 'vision', category: 'applied', maturity: 'demo', name: ['生成式影像修補', 'Generative Image Inpainting'],
    purpose: ['在可控圖像上比較遮罩區域修補，建立裝置最佳化前的桌面基線。', 'Compare masked inpainting on controlled images to establish a desktop baseline for device optimization.'],
    architecture: ['圖片與遮罩 → MI-GAN 或 Telea → 合成輸出 → 品質與延遲', 'Image and mask → MI-GAN or Telea → composited output → quality and latency'],
    evidence: ['兩個場景的桌面 CPU 量測。', 'Desktop CPU measurements on two scenes.'],
    demo: '/labs/evidence/vision/', legacy: true, offer: offer.edge,
  },
  {
    id: 'bazaar', category: 'applied', maturity: 'public', name: 'Bazaar of Fates',
    purpose: ['探索以確定性規則引擎產生結構化結果，再由 LLM 轉述的架構。', 'Explore a deterministic rules engine that produces structured results for LLM interpretation.'],
    architecture: ['參數輸入 → 多組確定性規則 → 結構化資料 → LLM 轉述', 'Input parameters → deterministic rule systems → structured data → LLM interpretation'],
    evidence: ['公開程式與架構說明。', 'Public source and architecture notes.'],
    repo: 'https://github.com/ChiShengChen/bazaar-of-fates', offer: offer.reliability,
  },
  {
    id: 'knowledge-arbitration', category: 'applied', maturity: 'demo', name: ['知識庫文件衝突裁決', 'Knowledge Base Conflict Arbitration'],
    purpose: ['在文件出現不同版本或條件時，顯示採用的證據與適用範圍。', 'Show the evidence and scope used when documents differ by version or applicability.'],
    architecture: ['情境輸入 → 候選文件 → 版本與條件檢查 → 引用及判定', 'Scenario → candidate documents → version and applicability checks → cited decision'],
    evidence: ['可檢查的合成企業手冊與裁決情境。', 'Inspectable synthetic manuals and arbitration scenarios.'],
    demo: '/labs/demos/knowledge-arbitration/', offer: offer.enterprise,
  },
  {
    id: 'robot-workcell', category: 'applied', maturity: 'demo', name: ['工業機器人工作站設計', 'Industrial Robot Workcell Design'],
    purpose: ['以示意模型探索工作站佈局及機器人選型的相依條件。', 'Explore how layout and robot selection interact using an illustrative workcell.'],
    architecture: ['工作站佈局 → 機型參數 → 可達性檢查 → 設計提醒', 'Workcell layout → robot parameters → reach checks → design notes'],
    evidence: ['合成工作站和可檢查的估算假設。', 'A synthetic workcell with inspectable estimation assumptions.'],
    demo: '/labs/demos/robot-workcell/', offer: offer.robotics,
  },
];

export const labDemos = [
  {
    route: '/labs/demos/reliability/', category: 'reliability',
    name: ['AI 可靠性與錯誤恢復', 'AI Reliability and Recovery'],
    detail: ['比較相同合成任務的基線、驗證與重試。', 'Compare a baseline, verification, and retries on the same synthetic tasks.'],
    evidence: ['合成任務與模擬執行', 'Synthetic tasks and simulated execution'],
  },
  {
    route: '/labs/demos/knowledge-arbitration/', category: 'applied',
    name: ['知識庫文件衝突裁決', 'Knowledge Base Conflict Arbitration'],
    detail: ['選擇情境，檢查相互矛盾的文件版本、適用條件與引用。', 'Choose a scenario and inspect conflicting document versions, applicability, and citations.'],
    evidence: ['合成企業手冊', 'Synthetic manuals'],
  },
  {
    route: '/labs/demos/robot-workcell/', category: 'applied',
    name: ['機器人工作站設計', 'Robot Workcell Design'],
    detail: ['調整工作站參數並檢查可達性與選型限制。', 'Adjust workcell parameters and examine reach and selection constraints.'],
    evidence: ['示意工作站與估算', 'Illustrative workcell and estimates'],
  },
  {
    route: '/labs/evidence/photonics/', legacy: true, category: 'science',
    name: ['光子網路故障模擬', 'Photonic Mesh Fault Simulation'],
    detail: ['指定相位偏移或功率衰減，比較故障點與各光路輸出。', 'Set phase offsets or attenuation and compare fault effects across output ports.'],
    evidence: ['可重跑的數值模擬', 'Reproducible numerical simulation'],
  },
  {
    route: '/labs/evidence/vision/', legacy: true, category: 'applied',
    name: ['生成式影像修補檢視器', 'Generative Vision Output Viewer'],
    detail: ['查看公開模型的輸入、原圖、遮罩和擷取的輸出。', 'Inspect inputs, mask, reference, and recorded outputs from a public model.'],
    evidence: ['桌面 CPU 實測輸出', 'Outputs from a measured desktop CPU run'],
  },
  {
    route: '/labs/evidence/gpu/', legacy: true, category: 'compute',
    name: ['GPU 排程事件重播', 'GPU Scheduling Event Replay'],
    detail: ['重播單卡工作站的任務生命週期和程序 VRAM 取樣。', 'Replay task lifecycles and sampled process VRAM from a single-GPU workstation.'],
    evidence: ['受控實跑紀錄', 'Recorded controlled run'],
  },
  {
    route: '/labs/interactive/#gpu-orchestration', legacy: true, category: 'compute',
    name: ['GPU 排程策略比較', 'GPU Scheduling Policy Comparison'],
    detail: ['調整合成工作集的資源規則，觀察不同策略模型。', 'Change resource rules for synthetic workloads and explore the simulated policies.'],
    evidence: ['瀏覽器模擬', 'Browser simulation'],
  },
  {
    route: '/labs/evidence/research/', legacy: true, category: 'research',
    name: ['Paper Evidence 引文查核重播', 'Paper Evidence Quote Check Replay'],
    detail: ['逐項檢查引文定位、文字正規化與數字上下文的測試結果。', 'Review fixture outcomes for quote location, text normalization, and numeric context.'],
    evidence: ['固定版本的引文查核重跑', 'Recorded checks from pinned source'],
  },
];
