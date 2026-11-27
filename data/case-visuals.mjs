const image = (path, width, height) => ({ path, width, height });

const featuredImage = (file, width, height) => image(`/assets/evidence/featured/${file}.webp`, width, height);

export const caseVisuals = {
  'industrial-robotics': [{
    files: [featuredImage('robotics', 760, 437)],
    alt: ['工作站配置工具顯示 3D 佈局、輸入規格與配置評分', 'The workcell optimizer shows a 3D layout, input specifications and scoring'],
    caption: ['創辦人的獨立公開 Demo，採用示例配置。', 'Founder’s independent public demo with an example layout.'],
    source: ['https://chishengchen.github.io/projects.html', 'https://chishengchen.github.io/projects.html'],
  }],
  'enterprise-knowledge-arbitration': [{
    files: [featuredImage('knowledge-zh', 1052, 232), featuredImage('knowledge-en', 1052, 232)],
    alt: ['同一組合成設備文件下，關鍵詞檢索與文件仲裁選出不同版本的壓力上限', 'Keyword retrieval and document arbitration select pressure limits from different versions of the same synthetic equipment documents'],
    caption: ['合成文件示範，畫面比較版本選擇與引用。', 'Synthetic-document demo comparing version selection and citations.'],
    source: ['/labs/demos/knowledge-arbitration/', '/en/labs/demos/knowledge-arbitration/'],
  }],
  'gpu-orchestration': [{
    files: [featuredImage('gpu-zh', 994, 194), featuredImage('gpu-en', 994, 194)],
    alt: ['單工作站受控實跑的程序 VRAM 取樣與保留量時間軸', 'Timeline of sampled process VRAM and reservations from the controlled single-workstation run'],
    caption: ['單工作站受控實跑的 VRAM 回放。', 'VRAM replay of the controlled single-workstation run.'],
    source: ['/labs/evidence/gpu/', '/labs/evidence/gpu/?lang=en'],
  }],
  'eeg-treatment-response': [{
    files: [featuredImage('eeg-research', 520, 313)],
    alt: ['額葉 EEG 研究的六步流程，包含訊號前處理、特徵擷取、模型訓練與跨資料集驗證', 'Six-step frontal EEG research workflow covering signal preprocessing, feature extraction, model training and cross-dataset validation'],
    caption: ['作者個人網站所刊載的 EEG 研究流程圖。', 'EEG research workflow published on the author’s site.'],
    source: ['https://chishengchen.github.io/teaser_jad.png', 'https://chishengchen.github.io/teaser_jad.png'],
  }],
  'photonic-computing': [{
    files: [featuredImage('photonics-zh', 986, 289), featuredImage('photonics-en', 986, 289)],
    alt: ['四通道光子網格中的干涉單元、故障位置與模擬輸出光功率', 'Four-channel photonic mesh showing interferometer cells, the selected fault and simulated output power'],
    caption: ['光子網格故障模擬畫面。', 'Photonic mesh fault simulator output.'],
    source: ['/labs/evidence/photonics/', '/labs/evidence/photonics/?lang=en'],
  }],
  'adaptive-physics-tutor': [{
    files: [image('/assets/evidence/education/general-physics-tutor.webp', 1600, 941)],
    alt: ['普通物理 AI 助教介面，顯示章節預習、教學、自由問答與測驗等學習模式', 'General Physics AI Tutor interface with chapter previews, guided lessons, Q&A and quizzes'],
    caption: ['普通物理 AI 助教的公開系統畫面。', 'Public interface of the General Physics AI Tutor.'],
    source: ['https://chishengchen.github.io/projects.html', 'https://chishengchen.github.io/projects.html'],
  }],
  'research-automation': [{
    files: [image('/assets/evidence/research/replay-zh.webp', 1052, 332), image('/assets/evidence/research/replay-en.webp', 1052, 333)],
    alt: ['科研查核畫面顯示合成來源段落、送查引文，以及數字出現在其他段落時的 NUM_FAIL 結果', 'Research verification screen showing a synthetic passage, the submitted quotation and NUM_FAIL when the number appears in another section'],
    caption: ['公開查核紀錄回放。合成測試中的數字脫離引文上下文，判定為 NUM_FAIL。', 'Public replay of a recorded test. The number is out of context in the synthetic input, so the verifier returns NUM_FAIL.'],
    source: ['/labs/evidence/research/', '/labs/evidence/research/?lang=en'],
  }],
  'on-device-generative-vision': [{
    files: [image('/assets/evidence/vision/hallway-input.webp', 768, 512)],
    alt: ['室內走廊照片上的合成人物遮住部分背景', 'Hallway photograph with an illustrated person composited in the foreground'],
    caption: ['輸入 · 走廊實拍搭配合成前景人物', 'Input · Hallway photo with an illustrated foreground person'],
  }, {
    files: [image('/assets/evidence/vision/hallway-migan.webp', 768, 512)],
    alt: ['MI-GAN 重建室內走廊背景的實際輸出', 'Actual MI-GAN output reconstructing the hallway background'],
    caption: ['修補後 · MI-GAN 在桌面 CPU 上的輸出', 'After inpainting · MI-GAN output on a desktop CPU'],
    source: ['/labs/evidence/vision/', '/labs/evidence/vision/?lang=en'],
  }],
};
