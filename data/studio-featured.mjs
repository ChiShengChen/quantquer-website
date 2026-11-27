const featuredImage = (file, width, height) => ({
  path: `/assets/evidence/featured/${file}.webp`, width, height,
});

export const featuredEvidence = {
  'industrial-robotics': {
    title: ['工業機器人工作站設計', 'Industrial robot workcell design'],
    problem: ['在廠房、機器人可達性與設備限制下規劃工作站。', 'Plan a workcell within facility, robot reach and equipment constraints.'],
    output: ['可審查的 2D／3D 配置、CAD 與物料清單。', 'Reviewable 2D and 3D layouts, CAD and a bill of materials.'],
    evidence: ['已交付設計軟體。節拍為設計估算。', 'Design software was delivered. Cycle times are planning estimates.'],
    source: ['/work/industrial-robotics/#case-evidence', '/en/work/industrial-robotics/#case-evidence-en'],
    sourceLabel: ['查看交付與驗收範圍', 'Review the delivery and acceptance scope'],
    visual: {
      files: [featuredImage('robotics', 760, 437)],
      alt: ['工作站配置工具顯示 3D 佈局、輸入規格與配置評分', 'The workcell optimizer shows a 3D layout, input specifications and scoring'],
      caption: ['創辦人的獨立公開 Demo，採用示例配置。', 'Founder’s independent public demo with an example layout.'],
      source: ['https://chishengchen.github.io/projects.html', 'https://chishengchen.github.io/projects.html'],
    },
  },
  'on-device-generative-vision': {
    title: ['生成式影像修補與晶片端部署', 'Generative image restoration and edge deployment'],
    problem: ['比較遮住區域的重建品質與運算成本。', 'Compare reconstruction quality and compute cost on the masked region.'],
    output: ['修補前後對照、逐次量測與裝置驗證規劃。', 'Before-and-after outputs, per-run measurements and a device validation plan.'],
    evidence: ['兩組場景的桌面 CPU 實測。晶片端部署屬驗證規劃。', 'Desktop CPU measurements on two scenes. Device deployment is a validation plan.'],
    source: ['/labs/evidence/vision/#benchmark', '/labs/evidence/vision/?lang=en#benchmark'],
    sourceLabel: ['查看 CPU 實測', 'Review the CPU benchmark'],
  },
  'enterprise-knowledge-arbitration': {
    title: ['企業技術文件仲裁', 'Enterprise technical knowledge arbitration'],
    problem: ['設備文件版本衝突時，回答需要可追查的依據。', 'Trace the source of an answer when equipment documents disagree.'],
    output: ['含文件版本、引用及人工覆核的問答流程。', 'A QA workflow that records document versions, citations and human review.'],
    evidence: ['歷史引用正確率 85%，限當時 28 題評測。', '85% historical citation accuracy on the original 28-question evaluation.'],
    source: ['/work/enterprise-knowledge-arbitration/#case-evidence', '/en/work/enterprise-knowledge-arbitration/#case-evidence-en'],
    sourceLabel: ['查看評測條件', 'Review the evaluation scope'],
    visual: {
      files: [featuredImage('knowledge-zh', 1052, 232), featuredImage('knowledge-en', 1052, 232)],
      alt: ['同一組合成設備文件下，關鍵詞檢索與文件仲裁選出不同版本的壓力上限', 'Keyword retrieval and document arbitration select pressure limits from different versions of the same synthetic equipment documents'],
      caption: ['合成文件示範，畫面比較版本選擇與引用。', 'Synthetic-document demo comparing version selection and citations.'],
      source: ['/labs/demos/knowledge-arbitration/', '/en/labs/demos/knowledge-arbitration/'],
    },
  },
  'gpu-orchestration': {
    title: ['GPU 運算資源排程', 'GPU workload orchestration'],
    problem: ['共用 GPU 任務排隊與 VRAM 需求難以預估。', 'Shared GPU queues make wait times and memory demand difficult to predict.'],
    output: ['排程回放、任務事件與程序 VRAM 樣本。', 'Replay, job events and process-level VRAM samples.'],
    evidence: ['單工作站受控實跑，包含兩項 CUDA 與一項 CPU 任務。', 'Controlled single-workstation run with two CUDA jobs and one CPU job.'],
    source: ['/labs/evidence/gpu/', '/labs/evidence/gpu/?lang=en'],
    sourceLabel: ['查看實跑紀錄', 'Inspect the recorded run'],
    visual: {
      files: [featuredImage('gpu-zh', 994, 194), featuredImage('gpu-en', 994, 194)],
      alt: ['單工作站受控實跑的程序 VRAM 取樣與保留量時間軸', 'Timeline of sampled process VRAM and reservations from the controlled single-workstation run'],
      caption: ['單工作站受控實跑的 VRAM 回放。', 'VRAM replay of the controlled single-workstation run.'],
    },
  },
  'eeg-treatment-response': {
    title: ['臨床 EEG 治療反應研究', 'Clinical EEG treatment-response research'],
    problem: ['研究治療前額葉 EEG 與腦刺激治療反應的關係。', 'Study the relationship between pretreatment frontal EEG and response to brain stimulation.'],
    output: ['可追查的訊號特徵與研究評估流程。', 'Traceable signal features and a research evaluation workflow.'],
    evidence: ['公開期刊論文，歸屬學術研究合作。', 'Peer-reviewed publication from an academic collaboration.'],
    source: ['https://doi.org/10.1016/j.jad.2023.08.059', 'https://doi.org/10.1016/j.jad.2023.08.059'],
    sourceLabel: ['查看期刊論文', 'Read the publication'],
    visual: {
      files: [featuredImage('eeg-research', 520, 313)],
      alt: ['額葉 EEG 研究的六步流程，包含訊號前處理、特徵擷取、模型訓練與跨資料集驗證', 'Six-step frontal EEG research workflow covering signal preprocessing, feature extraction, model training and cross-dataset validation'],
      caption: ['作者個人網站所刊載的 EEG 研究流程圖。', 'EEG research workflow published on the author’s site.'],
      source: ['https://chishengchen.github.io/teaser_jad.png', 'https://chishengchen.github.io/teaser_jad.png'],
    },
  },
  'photonic-computing': {
    title: ['光子網格與故障模擬', 'Photonic mesh fault simulation'],
    problem: ['檢查局部相位與耗損如何改變光子網路輸出。', 'Inspect how local phase and attenuation faults change photonic outputs.'],
    output: ['互動故障注入、輸出功率與固定測試資料。', 'Interactive fault injection, output-power comparisons and a fixed test fixture.'],
    evidence: ['四通道、四階段理想 MZI 的數值模擬。', 'Numerical simulation of a four-channel, four-stage ideal MZI mesh.'],
    source: ['/labs/evidence/photonics/', '/labs/evidence/photonics/?lang=en'],
    sourceLabel: ['操作光子模擬', 'Run the photonic simulation'],
    visual: {
      files: [featuredImage('photonics-zh', 986, 289), featuredImage('photonics-en', 986, 289)],
      alt: ['四通道光子網格中的干涉單元、故障位置與模擬輸出光功率', 'Four-channel photonic mesh showing interferometer cells, the selected fault and simulated output power'],
      caption: ['光子網格故障模擬畫面。', 'Photonic mesh fault simulator output.'],
    },
  },
};
